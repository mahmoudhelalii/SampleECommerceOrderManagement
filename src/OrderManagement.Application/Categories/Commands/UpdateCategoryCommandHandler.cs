using MediatR;
using OrderManagement.Application.Categories.Queries;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Categories.Commands;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    private readonly IApplicationDbContext _context;

    public UpdateCategoryCommandHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _context.Categories.FindAsync(new object[] { request.Id }, cancellationToken);
        if (category == null)
            return Result<CategoryDto>.Failure("Category not found.");
        category.NameEn = request.NameEn;
        category.NameAr = request.NameAr;
        category.Name = request.NameEn;
        category.Description = request.Description;
        await _context.SaveChangesAsync(cancellationToken);
        return Result<CategoryDto>.Success(new CategoryDto(category.Id, category.NameEn, category.NameAr, category.Description));
    }
}
