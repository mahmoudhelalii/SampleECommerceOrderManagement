using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Orders.Queries;

public record GetOrdersQuery(int Page = 1, int PageSize = 10, Guid? UserIdFilter = null)
    : IRequest<Result<PagedOrdersResult>>;

public record PagedOrdersResult(IReadOnlyList<OrderListItemDto> Items, int TotalCount, int Page, int PageSize);

public record OrderListItemDto(Guid Id, string Status, decimal TotalAmount, DateTime CreatedAt);
