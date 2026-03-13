using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Categories.Queries;

public record GetCategoriesQuery : IRequest<Result<IReadOnlyList<CategoryDto>>>;

public record CategoryDto(Guid Id, string NameEn, string NameAr, string? Description);
