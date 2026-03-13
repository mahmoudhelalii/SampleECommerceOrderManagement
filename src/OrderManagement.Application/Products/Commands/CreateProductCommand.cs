using MediatR;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Products.Queries;

namespace OrderManagement.Application.Products.Commands;

public record CreateProductCommand(
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    string? ImageUrl,
    decimal Price,
    int StockQuantity,
    Guid CategoryId,
    string? Sku = null) : IRequest<Result<ProductDto>>;
