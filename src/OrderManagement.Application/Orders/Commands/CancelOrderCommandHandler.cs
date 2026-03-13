using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Orders.Commands;

public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public CancelOrderCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<bool>> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .ThenInclude(oi => oi.Product)
            .FirstOrDefaultAsync(o => o.Id == request.OrderId, cancellationToken);

        if (order == null)
            return Result<bool>.Failure("Order not found.");

        if (!request.IsAdmin && order.UserId != request.UserId)
            return Result<bool>.Failure("Unauthorized.");

        if (order.Status == "Cancelled")
            return Result<bool>.Success(true);

        // Restore stock for each product in the order
        foreach (var item in order.OrderItems)
        {
            item.Product.StockQuantity += item.Quantity;
            item.Product.UpdatedAt = DateTime.UtcNow;
        }

        order.Status = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return Result<bool>.Success(true);
    }
}
