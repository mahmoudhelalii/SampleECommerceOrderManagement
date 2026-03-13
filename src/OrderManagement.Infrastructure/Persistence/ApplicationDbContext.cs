using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OrderManagement.Application.Common.Interfaces;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<UserFavorite> UserFavorites => Set<UserFavorite>();

    public Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        => Database.BeginTransactionAsync(cancellationToken);

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Product>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Category).WithMany(c => c.Products).HasForeignKey(p => p.CategoryId);
            e.HasMany(p => p.Reviews).WithOne(r => r.Product).HasForeignKey(r => r.ProductId);
        });
        builder.Entity<ProductReview>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasOne(r => r.User).WithMany(u => u.ProductReviews).HasForeignKey(r => r.UserId);
        });
        builder.Entity<Category>(e => e.HasKey(c => c.Id));
        builder.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasMany(o => o.OrderItems).WithOne(oi => oi.Order).HasForeignKey(oi => oi.OrderId);
            e.HasIndex(o => o.IdempotencyKey).IsUnique().HasFilter("[IdempotencyKey] IS NOT NULL");
        });
        builder.Entity<OrderItem>(e =>
        {
            e.HasKey(oi => oi.Id);
            e.HasOne(oi => oi.Product).WithMany(p => p.OrderItems).HasForeignKey(oi => oi.ProductId);
        });
        builder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasMany(u => u.Favorites).WithOne(f => f.User).HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Cascade);
        });
        builder.Entity<UserFavorite>(e =>
        {
            e.HasKey(f => new { f.UserId, f.ProductId });
            e.HasOne(f => f.Product).WithMany().HasForeignKey(f => f.ProductId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
