using MediatR;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Orders.Queries;

namespace OrderManagement.Application.Dashboard.Queries;

public record GetDashboardStatsQuery(Guid? UserIdFilter) : IRequest<Result<DashboardStatsDto>>;

public record DashboardStatsDto(
    int TotalOrders,
    decimal TotalRevenue,
    IReadOnlyList<OrdersByStatusDto> OrdersByStatus,
    int TotalProducts,
    int TotalCategories,
    int LowStockProductCount,
    IReadOnlyList<OrderListItemDto> RecentOrders);

public record OrdersByStatusDto(string Status, int Count);
