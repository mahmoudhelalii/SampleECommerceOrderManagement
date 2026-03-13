using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Favorites.Commands;

public class RemoveProductFavoriteCommandHandler : IRequestHandler<RemoveProductFavoriteCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public RemoveProductFavoriteCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<bool>> Handle(RemoveProductFavoriteCommand request, CancellationToken cancellationToken)
    {
        var fav = await _context.UserFavorites
            .FirstOrDefaultAsync(f => f.UserId == request.UserId && f.ProductId == request.ProductId, cancellationToken);
        if (fav != null)
        {
            _context.UserFavorites.Remove(fav);
            await _context.SaveChangesAsync(cancellationToken);
        }
        return Result<bool>.Success(true);
    }
}
