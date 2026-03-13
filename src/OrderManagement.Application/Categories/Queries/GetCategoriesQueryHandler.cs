using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Categories.Queries;

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, Result<IReadOnlyList<CategoryDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetCategoriesQueryHandler(IApplicationDbContext context) => _context = context;

    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var list = await _context.Categories
            .AsNoTracking()
            .Select(c => new CategoryDto(c.Id, c.NameEn, c.NameAr, c.Description))
            .ToListAsync(cancellationToken);
        return Result<IReadOnlyList<CategoryDto>>.Success(list);
    }
}
