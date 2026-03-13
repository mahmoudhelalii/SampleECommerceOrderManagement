namespace OrderManagement.Domain.Entities;

public class Order : BaseEntity
{
    public Guid UserId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Completed, Cancelled
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? DiscountCode { get; set; }
    public string? IdempotencyKey { get; set; }
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
