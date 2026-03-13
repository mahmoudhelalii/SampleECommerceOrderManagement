using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Products.Queries;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Products.Commands;

public class CreateProductReviewCommandHandler : IRequestHandler<CreateProductReviewCommand, Result<ProductReviewDto>>
{
    private readonly IApplicationDbContext _context;

    public CreateProductReviewCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<ProductReviewDto>> Handle(CreateProductReviewCommand request, CancellationToken cancellationToken)
    {
        if (request.Rating < 1 || request.Rating > 5)
            return Result<ProductReviewDto>.Failure("Rating must be between 1 and 5.");
        var product = await _context.Products.FindAsync(new object[] { request.ProductId }, cancellationToken);
        if (product == null)
            return Result<ProductReviewDto>.Failure("Product not found.");
        var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
        if (user == null)
            return Result<ProductReviewDto>.Failure("User not found.");
        var alreadyReviewed = await _context.ProductReviews
            .AnyAsync(r => r.ProductId == request.ProductId && r.UserId == request.UserId, cancellationToken);
        if (alreadyReviewed)
            return Result<ProductReviewDto>.Failure("You have already reviewed this product.");
        var review = new ProductReview
        {
            ProductId = request.ProductId,
            UserId = request.UserId,
            Rating = request.Rating,
            ReviewText = string.IsNullOrWhiteSpace(request.ReviewText) ? null : request.ReviewText.Trim(),
            CreatedAt = DateTime.UtcNow
        };
        _context.ProductReviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<ProductReviewDto>.Success(new ProductReviewDto(review.Id, review.ProductId, review.UserId, user.FullName, review.Rating, review.ReviewText, review.CreatedAt));
    }
}
