using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Authentication.Commands;
using OrderManagement.Application.Users.Commands;
using OrderManagement.Application.Users.Queries;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetUsersQuery(page, pageSize), cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { errors = result.Errors });
        var data = result.Data!;
        return Ok(new { data.Items, data.TotalCount, data.Page, data.PageSize });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var role = request.Role == "Admin" ? "Admin" : "Customer";
        var result = await _mediator.Send(new RegisterCommand(request.Email, request.Password, request.FullName, role), cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpPut("{id:guid}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateUserRoleCommand(id, request.Role), cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { errors = result.Errors });
        return NoContent();
    }
}

public record CreateUserRequest(string Email, string Password, string FullName, string Role);
public record UpdateRoleRequest(string Role);
