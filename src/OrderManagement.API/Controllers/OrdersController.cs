using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Orders.Commands;
using OrderManagement.Application.Orders.Queries;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator) => _mediator = mediator;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

    private bool IsAdmin => User.IsInRole("Admin");

    [HttpGet]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userIdFilter = IsAdmin ? (Guid?)null : UserId;
        var result = await _mediator.Send(new GetOrdersQuery(page, pageSize, userIdFilter), cancellationToken);
        return Ok(new { result.Data!.Items, result.Data.TotalCount, result.Data.Page, result.Data.PageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault()?.Trim();
        var result = await _mediator.Send(
            new CreateOrderCommand(UserId, request.DiscountCode, request.Items.Select(i => new OrderItemDto(i.ProductId, i.Quantity)).ToList(), idempotencyKey),
            cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetOrderByIdQuery(id, UserId), cancellationToken);
        if (!result.IsSuccess) return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CancelOrderCommand(id, UserId, IsAdmin), cancellationToken);
        if (!result.IsSuccess)
            return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return NoContent();
    }
}

public record CreateOrderRequest(string? DiscountCode, List<OrderItemRequest> Items);
public record OrderItemRequest(Guid ProductId, int Quantity);
