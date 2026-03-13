using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Favorites.Commands;
using OrderManagement.Application.Favorites.Queries;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IMediator _mediator;

    public FavoritesController(IMediator mediator) => _mediator = mediator;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetUserFavoritesQuery(UserId), cancellationToken);
        return Ok(result.Data);
    }

    [HttpPost("{productId:guid}")]
    public async Task<IActionResult> Add(Guid productId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new AddProductFavoriteCommand(UserId, productId), cancellationToken);
        if (!result.IsSuccess)
            return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return Ok();
    }

    [HttpDelete("{productId:guid}")]
    public async Task<IActionResult> Remove(Guid productId, CancellationToken cancellationToken)
    {
        await _mediator.Send(new RemoveProductFavoriteCommand(UserId, productId), cancellationToken);
        return NoContent();
    }
}
