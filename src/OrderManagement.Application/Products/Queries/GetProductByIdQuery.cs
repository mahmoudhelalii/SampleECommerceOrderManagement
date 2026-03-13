using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public record GetProductByIdQuery(Guid Id) : IRequest<Result<ProductDto>>;
