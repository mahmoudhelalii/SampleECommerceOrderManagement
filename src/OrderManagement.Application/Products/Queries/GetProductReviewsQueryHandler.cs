using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public class GetProductReviewsQueryHandler : IRequestHandler<GetProductReviewsQuery, Result<IReadOnlyList<ProductReviewDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProductReviewsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<IReadOnlyList<ProductReviewDto>>> Handle(GetProductReviewsQuery request, CancellationToken cancellationToken)
    {
        var exists = await _context.Products.AnyAsync(p => p.Id == request.ProductId, cancellationToken);
        if (!exists)
            return Result<IReadOnlyList<ProductReviewDto>>.Failure("Product not found.");
        var list = await _context.ProductReviews
            .AsNoTracking()
            .Include(r => r.User)
            .Where(r => r.ProductId == request.ProductId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ProductReviewDto(r.Id, r.ProductId, r.UserId, r.User.FullName, r.Rating, r.ReviewText, r.CreatedAt))
            .ToListAsync(cancellationToken);
        return Result<IReadOnlyList<ProductReviewDto>>.Success(list);
    }
}
