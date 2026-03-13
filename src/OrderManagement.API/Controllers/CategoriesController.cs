using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Categories.Commands;
using OrderManagement.Application.Categories.Queries;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCategoriesQuery(), cancellationToken);
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetCategoryByIdQuery(id), cancellationToken);
        if (!result.IsSuccess) return NotFound(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateCategoryCommand(request.NameEn, request.NameAr, request.Description), cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { errors = result.Errors });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateCategoryCommand(id, request.NameEn, request.NameAr, request.Description), cancellationToken);
        if (!result.IsSuccess) return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new DeleteCategoryCommand(id), cancellationToken);
        if (!result.IsSuccess) return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return NoContent();
    }
}

public record CreateCategoryRequest(string NameEn, string NameAr, string? Description);
public record UpdateCategoryRequest(string NameEn, string NameAr, string? Description);
