using MediatR;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Products.Queries;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Products.Commands;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, Result<ProductDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CreateProductCommandHandler(IUnitOfWork unitOfWork) => _unitOfWork = unitOfWork;

    public async Task<Result<ProductDto>> Handle(CreateProductCommand request, CancellationToken cancellationToken)
    {
        var categoryRepo = _unitOfWork.Repository<Category>();
        var category = await categoryRepo.GetByIdAsync(request.CategoryId, cancellationToken);
        if (category == null)
            return Result<ProductDto>.Failure("Category not found.");
        var product = new Product
        {
            NameEn = request.NameEn,
            NameAr = request.NameAr,
            Name = request.NameEn,
            Description = request.DescriptionEn,
            DescriptionEn = request.DescriptionEn,
            DescriptionAr = request.DescriptionAr,
            ImageUrl = request.ImageUrl,
            Price = request.Price,
            StockQuantity = request.StockQuantity,
            CategoryId = request.CategoryId,
            Sku = request.Sku,
            CreatedAt = DateTime.UtcNow
        };
        await _unitOfWork.Repository<Product>().AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result<ProductDto>.Success(new ProductDto(product.Id, product.NameEn, product.NameAr, product.DescriptionEn, product.DescriptionAr, product.ImageUrl, product.Price, product.StockQuantity, product.CategoryId, category.NameEn, category.NameAr, null, null, 0));
    }
}
