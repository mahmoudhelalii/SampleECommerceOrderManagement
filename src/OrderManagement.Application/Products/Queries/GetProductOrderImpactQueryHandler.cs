using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public class GetProductOrderImpactQueryHandler : IRequestHandler<GetProductOrderImpactQuery, Result<ProductOrderImpactDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductOrderImpactQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<ProductOrderImpactDto>> Handle(GetProductOrderImpactQuery request, CancellationToken cancellationToken)
    {
        var productExists = await _context.Products.AnyAsync(p => p.Id == request.ProductId, cancellationToken);
        if (!productExists)
            return Result<ProductOrderImpactDto>.Failure("Product not found.");

        var quantityInOrders = await _context.OrderItems
            .Where(o => o.ProductId == request.ProductId)
            .SumAsync(o => o.Quantity, cancellationToken);

        var orderCount = await _context.OrderItems
            .Where(o => o.ProductId == request.ProductId)
            .Select(o => o.OrderId)
            .Distinct()
            .CountAsync(cancellationToken);

        return Result<ProductOrderImpactDto>.Success(new ProductOrderImpactDto(quantityInOrders, orderCount));
    }
}
