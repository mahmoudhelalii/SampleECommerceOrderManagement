using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public record GetProductsQuery(
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    Guid? CategoryId = null,
    string? SortBy = "NameEn",
    bool SortDesc = false
) : IRequest<Result<PagedResult<ProductDto>>>;

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public record ProductDto(
    Guid Id,
    string NameEn,
    string NameAr,
    string? DescriptionEn,
    string? DescriptionAr,
    string? ImageUrl,
    decimal Price,
    int StockQuantity,
    Guid CategoryId,
    string? CategoryNameEn,
    string? CategoryNameAr,
    string? Sku = null,
    double? AverageRating = null,
    int ReviewCount = 0);
