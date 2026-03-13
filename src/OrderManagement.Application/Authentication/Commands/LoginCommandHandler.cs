using MediatR;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Application.Common.Models;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Authentication.Commands;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResponse>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
        if (user == null)
            return Result<LoginResponse>.Failure("Invalid email or password.");

        // Simplified: in production use BCrypt or similar to verify password
        var passwordValid = VerifyPassword(request.Password, user.PasswordHash);
        if (!passwordValid)
            return Result<LoginResponse>.Failure("Invalid email or password.");

        var token = _jwtService.GenerateToken(user);
        return Result<LoginResponse>.Success(new LoginResponse(token, user.Email, user.FullName, user.Role));
    }

    private static bool VerifyPassword(string password, string hash)
    {
        // For demo: stored as base64 of password. Replace with BCrypt in production.
        try
        {
            var bytes = Convert.FromBase64String(hash);
            var stored = System.Text.Encoding.UTF8.GetString(bytes);
            return stored == password;
        }
        catch { return false; }
    }
}
