using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Favorites.Queries;

public class GetUserFavoritesQueryHandler : IRequestHandler<GetUserFavoritesQuery, Result<IReadOnlyList<Guid>>>
{
    private readonly IApplicationDbContext _context;

    public GetUserFavoritesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<IReadOnlyList<Guid>>> Handle(GetUserFavoritesQuery request, CancellationToken cancellationToken)
    {
        var list = await _context.UserFavorites
            .AsNoTracking()
            .Where(f => f.UserId == request.UserId)
            .Select(f => f.ProductId)
            .ToListAsync(cancellationToken);
        return Result<IReadOnlyList<Guid>>.Success(list);
    }
}
