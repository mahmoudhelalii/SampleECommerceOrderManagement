using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Favorites.Queries;

public record GetUserFavoritesQuery(Guid UserId) : IRequest<Result<IReadOnlyList<Guid>>>;
