using MediatR;
using OrderManagement.Application.Common.Models;

namespace OrderManagement.Application.Users.Queries;

public record GetUsersQuery(int Page = 1, int PageSize = 20) : IRequest<Result<PagedUsersResult>>;

public record UserListItemDto(Guid Id, string Email, string FullName, string Role, DateTime CreatedAt);

public record PagedUsersResult(IReadOnlyList<UserListItemDto> Items, int TotalCount, int Page, int PageSize);
