using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public GetProductByIdQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<ProductDto>> Handle(GetProductByIdQuery request, CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (product == null)
            return Result<ProductDto>.Failure("Product not found.");
        var reviewCount = product.Reviews.Count;
        var averageRating = reviewCount > 0 ? (double?)product.Reviews.Average(r => r.Rating) : null;
        return Result<ProductDto>.Success(new ProductDto(
            product.Id, product.NameEn, product.NameAr, product.DescriptionEn ?? product.Description, product.DescriptionAr, product.ImageUrl, product.Price, product.StockQuantity,
            product.CategoryId, product.Category.NameEn, product.Category.NameAr, product.Sku, averageRating, reviewCount));
    }
}
