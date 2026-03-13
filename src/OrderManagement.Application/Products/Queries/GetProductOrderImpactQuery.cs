using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Products.Queries;

public record GetProductOrderImpactQuery(Guid ProductId) : IRequest<Result<ProductOrderImpactDto>>;

public record ProductOrderImpactDto(int QuantityInOrders, int OrderCount);
