using MediatR;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Orders.Commands;

namespace OrderManagement.Application.Orders.Queries;

public record GetOrderByIdQuery(Guid Id, Guid? UserId = null) : IRequest<Result<OrderDetailDto>>;

public record OrderDetailDto(
    Guid Id,
    decimal SubTotal,
    decimal DiscountAmount,
    decimal TotalAmount,
    string Status,
    string? DiscountCode,
    IReadOnlyList<OrderItemResponse> Items);
