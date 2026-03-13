using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Authentication.Commands;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    private readonly IApplicationDbContext _context;

    public RegisterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RegisterResponse>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email, cancellationToken))
            return Result<RegisterResponse>.Failure("Email already registered.");

        var hash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(request.Password)); // Demo only; use BCrypt in production
        var user = new User
        {
            Email = request.Email,
            PasswordHash = hash,
            FullName = request.FullName,
            Role = request.Role,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
        return Result<RegisterResponse>.Success(new RegisterResponse(user.Id, user.Email, user.FullName, user.Role));
    }
}
