using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Favorites.Commands;

public record AddProductFavoriteCommand(Guid UserId, Guid ProductId) : IRequest<Result<bool>>;
