using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Authentication.Commands;

public record LoginCommand(string Email, string Password) : IRequest<Result<LoginResponse>>;

public record LoginResponse(string Token, string Email, string FullName, string Role);
