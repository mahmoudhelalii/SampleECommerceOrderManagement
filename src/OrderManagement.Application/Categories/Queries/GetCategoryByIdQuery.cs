using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Categories.Queries;

public record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;
