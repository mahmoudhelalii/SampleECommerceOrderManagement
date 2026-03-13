using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Authentication.Commands;

public record RegisterCommand(string Email, string Password, string FullName, string Role = "Customer") : IRequest<Result<RegisterResponse>>;

public record RegisterResponse(Guid Id, string Email, string FullName, string Role);
