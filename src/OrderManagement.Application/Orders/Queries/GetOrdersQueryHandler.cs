using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Orders.Queries;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, Result<PagedOrdersResult>>
{
    private readonly IApplicationDbContext _context;

    public GetOrdersQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<PagedOrdersResult>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Orders.AsNoTracking();
        if (request.UserIdFilter.HasValue)
            query = query.Where(o => o.UserId == request.UserIdFilter.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new OrderListItemDto(o.Id, o.Status, o.TotalAmount, o.CreatedAt))
            .ToListAsync(cancellationToken);

        return Result<PagedOrdersResult>.Success(
            new PagedOrdersResult(items, total, request.Page, request.PageSize));
    }
}
