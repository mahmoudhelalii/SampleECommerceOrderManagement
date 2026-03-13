using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Categories.Commands;

public record DeleteCategoryCommand(Guid Id) : IRequest<Result<Unit>>;
