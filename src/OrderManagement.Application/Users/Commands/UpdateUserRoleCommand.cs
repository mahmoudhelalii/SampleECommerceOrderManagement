using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Users.Commands;

public record UpdateUserRoleCommand(Guid UserId, string Role) : IRequest<Result<Unit>>;
