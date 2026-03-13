using MediatR;
using OrderManagement.Application.Categories.Queries;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Categories.Commands;

public record UpdateCategoryCommand(Guid Id, string NameEn, string NameAr, string? Description) : IRequest<Result<CategoryDto>>;
