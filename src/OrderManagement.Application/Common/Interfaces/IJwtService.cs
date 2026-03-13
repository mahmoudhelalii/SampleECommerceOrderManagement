using OrderManagement.Domain.Entities;

namespace OrderManagement.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
