using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Orders.Commands;

namespace OrderManagement.Application.Orders.Queries;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, Result<OrderDetailDto>>
{
    private readonly IApplicationDbContext _context;

    public GetOrderByIdQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<OrderDetailDto>> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        if (order == null)
            return Result<OrderDetailDto>.Failure("Order not found.");
        if (request.UserId.HasValue && order.UserId != request.UserId.Value)
            return Result<OrderDetailDto>.Failure("Unauthorized.");
        var items = order.OrderItems.Select(oi => new OrderItemResponse(
            oi.ProductId, oi.Product.Name, oi.Quantity, oi.UnitPrice, oi.LineTotal)).ToList();
        return Result<OrderDetailDto>.Success(new OrderDetailDto(
            order.Id, order.SubTotal, order.DiscountAmount, order.TotalAmount, order.Status, order.DiscountCode, items));
    }
}
