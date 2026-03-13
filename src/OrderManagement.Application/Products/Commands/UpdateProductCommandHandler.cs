using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Products.Queries;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Products.Commands;

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, Result<ProductDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateProductCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<ProductDto>> Handle(UpdateProductCommand request, CancellationToken cancellationToken)
    {
        var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (product == null)
            return Result<ProductDto>.Failure("Product not found.");
        var category = await _context.Categories.FindAsync(new object[] { request.CategoryId }, cancellationToken);
        if (category == null)
            return Result<ProductDto>.Failure("Category not found.");

        var quantityInOrders = await _context.OrderItems
            .Where(o => o.ProductId == request.Id)
            .SumAsync(o => o.Quantity, cancellationToken);
        if (request.StockQuantity < quantityInOrders)
            return Result<ProductDto>.Failure(
                $"Stock cannot be set below the total quantity already in existing orders ({quantityInOrders}).");

        product.NameEn = request.NameEn;
        product.NameAr = request.NameAr;
        product.Name = request.NameEn;
        product.Description = request.DescriptionEn;
        product.DescriptionEn = request.DescriptionEn;
        product.DescriptionAr = request.DescriptionAr;
        product.ImageUrl = request.ImageUrl;
        product.Price = request.Price;
        product.StockQuantity = request.StockQuantity;
        product.CategoryId = request.CategoryId;
        product.Sku = request.Sku;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        var reviewCount = await _context.ProductReviews.CountAsync(r => r.ProductId == product.Id, cancellationToken);
        var averageRating = reviewCount > 0 ? (double?)await _context.ProductReviews.Where(r => r.ProductId == product.Id).AverageAsync(r => r.Rating, cancellationToken) : null;
        return Result<ProductDto>.Success(new ProductDto(product.Id, product.NameEn, product.NameAr, product.DescriptionEn, product.DescriptionAr, product.ImageUrl, product.Price, product.StockQuantity, product.CategoryId, category.NameEn, category.NameAr, product.Sku, averageRating, reviewCount));
    }
}
