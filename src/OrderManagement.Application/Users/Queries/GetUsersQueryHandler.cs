using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Users.Queries;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, Result<PagedUsersResult>>
{
    private readonly IApplicationDbContext _context;

    public GetUsersQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<PagedUsersResult>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Users.AsNoTracking().OrderByDescending(u => u.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UserListItemDto(u.Id, u.Email, u.FullName, u.Role, u.CreatedAt))
            .ToListAsync(cancellationToken);

        var paged = new PagedUsersResult(items, totalCount, request.Page, request.PageSize);
        return Result<PagedUsersResult>.Success(paged);
    }
}
