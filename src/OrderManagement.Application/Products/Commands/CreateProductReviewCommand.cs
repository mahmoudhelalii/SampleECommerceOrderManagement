using MediatR;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Products.Queries;

namespace OrderManagement.Application.Products.Commands;

public record CreateProductReviewCommand(
    Guid ProductId,
    Guid UserId,
    int Rating,
    string? ReviewText) : IRequest<Result<ProductReviewDto>>;
