using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Favorites.Commands;

public class AddProductFavoriteCommandHandler : IRequestHandler<AddProductFavoriteCommand, Result<bool>>
{
    private readonly IApplicationDbContext _context;

    public AddProductFavoriteCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<bool>> Handle(AddProductFavoriteCommand request, CancellationToken cancellationToken)
    {
        var exists = await _context.Products.AnyAsync(p => p.Id == request.ProductId, cancellationToken);
        if (!exists)
            return Result<bool>.Failure("Product not found.");
        var already = await _context.UserFavorites
            .AnyAsync(f => f.UserId == request.UserId && f.ProductId == request.ProductId, cancellationToken);
        if (already)
            return Result<bool>.Success(true);
        _context.UserFavorites.Add(new UserFavorite
        {
            UserId = request.UserId,
            ProductId = request.ProductId,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync(cancellationToken);
        return Result<bool>.Success(true);
    }
}
