using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using OrderManagement.Application.Common.Models;
using OrderManagement.Application.Products.Commands;
using OrderManagement.Application.Products.Queries;
using System.Security.Claims;

namespace OrderManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IWebHostEnvironment _env;

    public ProductsController(IMediator mediator, IWebHostEnvironment env)
    {
        _mediator = mediator;
        _env = env;
    }

    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadImage(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { errors = new[] { "No file uploaded." } });
        var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(ext) || !allowed.Contains(ext))
            return BadRequest(new { errors = new[] { "Invalid file type. Allowed: jpg, jpeg, png, gif, webp." } });
        var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath ?? Directory.GetCurrentDirectory(), "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "images", "products");
        if (!Directory.Exists(webRoot))
            Directory.CreateDirectory(webRoot);
        if (!Directory.Exists(uploadsDir))
            Directory.CreateDirectory(uploadsDir);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);
        await using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream, cancellationToken);
        var relativePath = $"images/products/{fileName}";
        return Ok(new { path = relativePath });
    }

    [HttpGet]
    public async Task<IActionResult> GetProducts(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? sortBy = "Name",
        [FromQuery] bool sortDesc = false,
        CancellationToken cancellationToken = default)
    {
        var result = await _mediator.Send(new GetProductsQuery(page, pageSize, search, categoryId, sortBy, sortDesc), cancellationToken);
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProductByIdQuery(id), cancellationToken);
        if (!result.IsSuccess) return NotFound(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}/order-impact")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetOrderImpact(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProductOrderImpactQuery(id), cancellationToken);
        if (!result.IsSuccess) return NotFound(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpGet("{id:guid}/reviews")]
    public async Task<IActionResult> GetReviews(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new GetProductReviewsQuery(id), cancellationToken);
        if (!result.IsSuccess) return NotFound(new { errors = result.Errors });
        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/reviews")]
    [Authorize]
    public async Task<IActionResult> CreateReview(Guid id, [FromBody] CreateProductReviewRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();
        var result = await _mediator.Send(new CreateProductReviewCommand(id, userId, request.Rating, request.ReviewText), cancellationToken);
        if (!result.IsSuccess) return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return CreatedAtAction(nameof(GetReviews), new { id }, result.Data);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateProductRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new CreateProductCommand(request.NameEn, request.NameAr, request.DescriptionEn, request.DescriptionAr, request.ImageUrl, request.Price, request.StockQuantity, request.CategoryId, request.Sku), cancellationToken);
        if (!result.IsSuccess) return BadRequest(new { errors = result.Errors });
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result.Data);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new UpdateProductCommand(id, request.NameEn, request.NameAr, request.DescriptionEn, request.DescriptionAr, request.ImageUrl, request.Price, request.StockQuantity, request.CategoryId, request.Sku), cancellationToken);
        if (!result.IsSuccess) return result.Errors[0].Contains("not found") ? NotFound(new { errors = result.Errors }) : BadRequest(new { errors = result.Errors });
        return Ok(result.Data);
    }
}

public record CreateProductRequest(string NameEn, string NameAr, string? DescriptionEn, string? DescriptionAr, string? ImageUrl, decimal Price, int StockQuantity, Guid CategoryId, string? Sku = null);
public record UpdateProductRequest(string NameEn, string NameAr, string? DescriptionEn, string? DescriptionAr, string? ImageUrl, decimal Price, int StockQuantity, Guid CategoryId, string? Sku = null);
public record CreateProductReviewRequest(int Rating, string? ReviewText);
