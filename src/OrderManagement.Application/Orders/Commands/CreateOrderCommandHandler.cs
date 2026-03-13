using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Orders.Commands;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, Result<CreateOrderResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public CreateOrderCommandHandler(IApplicationDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CreateOrderResponse>> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
    {
        var validationFailure = ValidateRequest(request);
        if (validationFailure is not null)
            return validationFailure;

        var idempotentResponse = await TryReturnExistingOrderIfIdempotentAsync(request, cancellationToken);
        if (idempotentResponse is not null)
            return idempotentResponse;

        await using var transaction = await _context.BeginTransactionAsync(cancellationToken);
        try
        {
            var products = await GetProductsByIdAsync(request.Items!, cancellationToken);
            var orderItemsResult = ValidateAndBuildOrderItems(request.Items!, products);
            if (!orderItemsResult.IsSuccess)
                return Result<CreateOrderResponse>.Failure(orderItemsResult.Error!);

            var discountAmount = CalculateDiscountAmount(request.DiscountCode, orderItemsResult.SubTotal);
            var order = CreateOrderEntity(request, orderItemsResult.SubTotal, discountAmount);

            await PersistOrderWithItemsAndUpdateStockAsync(
                order,
                orderItemsResult.Items,
                request.Items!,
                products,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return Result<CreateOrderResponse>.Success(
                MapToCreateOrderResponse(order, orderItemsResult.Items, products));
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static Result<CreateOrderResponse>? ValidateRequest(CreateOrderCommand request)
    {
        if (request.Items == null || !request.Items.Any())
            return Result<CreateOrderResponse>.Failure("Order must have at least one item.");
        return null;
    }

    private async Task<Result<CreateOrderResponse>?> TryReturnExistingOrderIfIdempotentAsync(
        CreateOrderCommand request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            return null;

        var existing = await _unitOfWork.Repository<Order>().DbSet
            .AsNoTracking()
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(
                o => o.IdempotencyKey == request.IdempotencyKey && o.UserId == request.UserId,
                cancellationToken);

        if (existing is null)
            return null;

        var responseItems = existing.OrderItems
            .Select(oi => new OrderItemResponse(
                oi.ProductId,
                oi.Product!.Name,
                oi.Quantity,
                oi.UnitPrice,
                oi.LineTotal))
            .ToList();

        return Result<CreateOrderResponse>.Success(new CreateOrderResponse(
            existing.Id,
            existing.SubTotal,
            existing.DiscountAmount,
            existing.TotalAmount,
            existing.Status,
            responseItems));
    }

    private async Task<Dictionary<Guid, Product>> GetProductsByIdAsync(
        IReadOnlyList<OrderItemDto> items,
        CancellationToken cancellationToken)
    {
        var productIds = items.Select(x => x.ProductId).Distinct().ToList();
        var query = _unitOfWork.Repository<Product>().DbSet.Where(p => productIds.Contains(p.Id));
        return await query.ToDictionaryAsync(p => p.Id, cancellationToken);
    }

    private static (bool IsSuccess, decimal SubTotal, List<OrderItem> Items, string? Error) ValidateAndBuildOrderItems(
        IReadOnlyList<OrderItemDto> items,
        Dictionary<Guid, Product> products)
    {
        decimal subTotal = 0;
        var orderItems = new List<OrderItem>();

        foreach (var item in items)
        {
            if (!products.TryGetValue(item.ProductId, out var product))
                return (false, 0, new List<OrderItem>(), $"Product {item.ProductId} not found.");

            if (product.StockQuantity < item.Quantity)
                return (false, 0, new List<OrderItem>(),
                    $"Insufficient stock for product '{product.Name}'. Available: {product.StockQuantity}.");

            var lineTotal = product.Price * item.Quantity;
            subTotal += lineTotal;
            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                LineTotal = lineTotal,
                CreatedAt = DateTime.UtcNow
            });
        }

        return (true, subTotal, orderItems, null);
    }

    private static decimal CalculateDiscountAmount(string? discountCode, decimal subTotal)
    {
        if (string.IsNullOrWhiteSpace(discountCode))
            return 0;

        if (discountCode.Equals("SAVE10", StringComparison.OrdinalIgnoreCase))
            return subTotal * 0.10m;
        if (discountCode.Equals("SAVE20", StringComparison.OrdinalIgnoreCase))
            return subTotal * 0.20m;

        return 0;
    }

    private static Order CreateOrderEntity(CreateOrderCommand request, decimal subTotal, decimal discountAmount)
    {
        var totalAmount = subTotal - discountAmount;
        return new Order
        {
            UserId = request.UserId,
            Status = "Completed",
            SubTotal = subTotal,
            DiscountAmount = discountAmount,
            TotalAmount = totalAmount,
            DiscountCode = request.DiscountCode,
            IdempotencyKey = request.IdempotencyKey,
            CreatedAt = DateTime.UtcNow
        };
    }

    private async Task PersistOrderWithItemsAndUpdateStockAsync(
        Order order,
        List<OrderItem> orderItems,
        IReadOnlyList<OrderItemDto> requestItems,
        Dictionary<Guid, Product> products,
        CancellationToken cancellationToken)
    {
        await _unitOfWork.Repository<Order>().AddAsync(order, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        foreach (var oi in orderItems)
        {
            oi.OrderId = order.Id;
            await _unitOfWork.Repository<OrderItem>().AddAsync(oi, cancellationToken);
        }

        foreach (var item in requestItems)
        {
            var product = products[item.ProductId];
            product.StockQuantity -= item.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static CreateOrderResponse MapToCreateOrderResponse(
        Order order,
        List<OrderItem> orderItems,
        Dictionary<Guid, Product> products)
    {
        var responseItems = orderItems
            .Select(oi => new OrderItemResponse(
                products[oi.ProductId].Id,
                products[oi.ProductId].Name,
                oi.Quantity,
                oi.UnitPrice,
                oi.LineTotal))
            .ToList();

        return new CreateOrderResponse(
            order.Id,
            order.SubTotal,
            order.DiscountAmount,
            order.TotalAmount,
            order.Status,
            responseItems);
    }
}
