using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Orders.Queries;

namespace OrderManagement.Application.Dashboard.Queries;

public class GetDashboardStatsQueryHandler : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private const int LowStockThreshold = 10;
    private const int RecentOrdersCount = 5;

    private readonly IApplicationDbContext _context;

    public GetDashboardStatsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var ordersQuery = _context.Orders.AsNoTracking();
        if (request.UserIdFilter.HasValue)
            ordersQuery = ordersQuery.Where(o => o.UserId == request.UserIdFilter.Value);

        var totalOrders = await ordersQuery.CountAsync(cancellationToken);
        var totalRevenue = await ordersQuery.SumAsync(o => o.TotalAmount, cancellationToken);

        var ordersByStatus = await ordersQuery
            .GroupBy(o => o.Status)
            .Select(g => new OrdersByStatusDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        var recentOrders = await ordersQuery
            .OrderByDescending(o => o.CreatedAt)
            .Take(RecentOrdersCount)
            .Select(o => new OrderListItemDto(o.Id, o.Status, o.TotalAmount, o.CreatedAt))
            .ToListAsync(cancellationToken);

        var totalProducts = await _context.Products.CountAsync(cancellationToken);
        var totalCategories = await _context.Categories.CountAsync(cancellationToken);
        var lowStockCount = await _context.Products.CountAsync(p => p.StockQuantity < LowStockThreshold, cancellationToken);

        var dto = new DashboardStatsDto(
            totalOrders,
            totalRevenue,
            ordersByStatus,
            totalProducts,
            totalCategories,
            lowStockCount,
            recentOrders);

        return Result<DashboardStatsDto>.Success(dto);
    }
}
