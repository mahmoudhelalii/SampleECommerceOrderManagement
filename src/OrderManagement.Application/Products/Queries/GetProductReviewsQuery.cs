using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public record GetProductReviewsQuery(Guid ProductId) : IRequest<Result<IReadOnlyList<ProductReviewDto>>>;

public record ProductReviewDto(
    Guid Id,
    Guid ProductId,
    Guid UserId,
    string UserName,
    int Rating,
    string? ReviewText,
    DateTime CreatedAt);
