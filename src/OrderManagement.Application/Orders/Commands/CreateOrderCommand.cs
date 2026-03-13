using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Orders.Commands;

public record CreateOrderCommand(Guid UserId, string? DiscountCode, IReadOnlyList<OrderItemDto> Items, string? IdempotencyKey = null) : IRequest<Result<CreateOrderResponse>>;

public record OrderItemDto(Guid ProductId, int Quantity);

public record CreateOrderResponse(
    Guid OrderId,
    decimal SubTotal,
    decimal DiscountAmount,
    decimal TotalAmount,
    string Status,
    IReadOnlyList<OrderItemResponse> OrderItems);

public record OrderItemResponse(Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
