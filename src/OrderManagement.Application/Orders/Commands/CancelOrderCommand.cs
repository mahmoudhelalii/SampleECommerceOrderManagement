using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Orders.Commands;

public record CancelOrderCommand(Guid OrderId, Guid UserId, bool IsAdmin) : IRequest<Result<bool>>;
