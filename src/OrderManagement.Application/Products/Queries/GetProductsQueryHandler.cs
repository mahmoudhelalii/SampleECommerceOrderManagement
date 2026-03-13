using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, Result<PagedResult<ProductDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProductsQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<PagedResult<ProductDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Products.Include(p => p.Category).Include(p => p.Reviews).AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(p => p.Name.Contains(request.Search)
                || (p.Description != null && p.Description.Contains(request.Search))
                || (p.DescriptionEn != null && p.DescriptionEn.Contains(request.Search))
                || (p.DescriptionAr != null && p.DescriptionAr.Contains(request.Search)));
        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        var total = await query.CountAsync(cancellationToken);
        var sortProperty = request.SortBy?.ToLowerInvariant() ?? "nameen";
        query = sortProperty switch
        {
            "price" => request.SortDesc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
            "stock" => request.SortDesc ? query.OrderByDescending(p => p.StockQuantity) : query.OrderBy(p => p.StockQuantity),
            "namear" => request.SortDesc ? query.OrderByDescending(p => p.NameAr) : query.OrderBy(p => p.NameAr),
            _ => request.SortDesc ? query.OrderByDescending(p => p.NameEn) : query.OrderBy(p => p.NameEn)
        };
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductDto(p.Id, p.NameEn, p.NameAr, p.DescriptionEn ?? p.Description, p.DescriptionAr, p.ImageUrl, p.Price, p.StockQuantity, p.CategoryId, p.Category.NameEn, p.Category.NameAr, p.Sku, p.Reviews.Count > 0 ? (double?)p.Reviews.Average(r => r.Rating) : null, p.Reviews.Count))
            .ToListAsync(cancellationToken);
        return Result<PagedResult<ProductDto>>.Success(new PagedResult<ProductDto>(items, total, request.Page, request.PageSize));
    }
}
