using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Entities;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.API;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (db.Database.IsSqlServer())
        {
            await db.Database.EnsureCreatedAsync();
            await EnsureProductNameEnNameArColumnsAsync(db);
            await EnsureProductDescriptionEnDescriptionArColumnsAsync(db);
            await EnsureProductImageUrlColumnAsync(db);
            await EnsureProductSkuColumnAsync(db);
            await EnsureCategoryNameEnNameArColumnsAsync(db);
            await EnsureProductReviewsTableAsync(db);
            await EnsureUserFavoritesTableAsync(db);
            await EnsureOrderIdempotencyKeyColumnAsync(db);
        }
        if (await db.Users.AnyAsync()) return;

        var adminHash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("Admin@123"));
        var admin = new User
        {
            Email = "admin@example.com",
            PasswordHash = adminHash,
            FullName = "Admin User",
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        };
        var customer = new User
        {
            Email = "customer@example.com",
            PasswordHash = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("Customer@123")),
            FullName = "Test Customer",
            Role = "Customer",
            CreatedAt = DateTime.UtcNow
        };
        db.Users.AddRange(admin, customer);

        var cat1 = new Category { NameEn = "Electronics", NameAr = "إلكترونيات", Name = "Electronics", Description = "Electronic devices", CreatedAt = DateTime.UtcNow };
        var cat2 = new Category { NameEn = "Clothing", NameAr = "ملابس", Name = "Clothing", Description = "Apparel", CreatedAt = DateTime.UtcNow };
        db.Categories.AddRange(cat1, cat2);
        await db.SaveChangesAsync();

        db.Products.AddRange(
            new Product { NameEn = "Laptop", NameAr = "لابتوب", Name = "Laptop", Description = "Gaming laptop", DescriptionEn = "Gaming laptop", DescriptionAr = "لابتوب ألعاب", Price = 999.99m, StockQuantity = 10, CategoryId = cat1.Id, CreatedAt = DateTime.UtcNow },
            new Product { NameEn = "Mouse", NameAr = "ماوس", Name = "Mouse", Description = "Wireless mouse", DescriptionEn = "Wireless mouse", DescriptionAr = "ماوس لاسلكي", Price = 29.99m, StockQuantity = 50, CategoryId = cat1.Id, CreatedAt = DateTime.UtcNow },
            new Product { NameEn = "T-Shirt", NameAr = "تي شيرت", Name = "T-Shirt", Description = "Cotton t-shirt", DescriptionEn = "Cotton t-shirt", DescriptionAr = "تي شيرت قطن", Price = 19.99m, StockQuantity = 100, CategoryId = cat2.Id, CreatedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();
    }

    /// <summary>
    /// Adds NameEn and NameAr columns to Products table if missing (e.g. DB was created with older model), and backfills from Name.
    /// </summary>
    private static async Task EnsureProductNameEnNameArColumnsAsync(ApplicationDbContext db)
    {
        // Batch 1: add columns if missing (SQL Server compiles whole batch, so ALTER must be alone)
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = N'NameEn')
                ALTER TABLE Products ADD NameEn nvarchar(max) NOT NULL DEFAULT N'', NameAr nvarchar(max) NOT NULL DEFAULT N''
            """);
        // Batch 2: backfill (run in separate batch so NameEn/NameAr are visible after ALTER)
        await db.Database.ExecuteSqlRawAsync("""
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = N'NameEn')
                UPDATE Products SET NameEn = ISNULL(Name, N''), NameAr = N'' WHERE NameEn = N'' OR NameAr = N''
            """);
    }

    /// <summary>
    /// Adds DescriptionEn and DescriptionAr columns to Products table if missing, and backfills from Description.
    /// </summary>
    private static async Task EnsureProductDescriptionEnDescriptionArColumnsAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = N'DescriptionEn')
                ALTER TABLE Products ADD DescriptionEn nvarchar(max) NULL, DescriptionAr nvarchar(max) NULL
            """);
        await db.Database.ExecuteSqlRawAsync("""
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = N'DescriptionEn')
                UPDATE Products SET DescriptionEn = ISNULL(DescriptionEn, Description), DescriptionAr = ISNULL(DescriptionAr, N'') WHERE DescriptionEn IS NULL
            """);
    }

    /// <summary>
    /// Adds ImageUrl column to Products table if missing.
    /// </summary>
    private static async Task EnsureProductImageUrlColumnAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = N'ImageUrl')
                ALTER TABLE Products ADD ImageUrl nvarchar(max) NULL
            """);
    }

    private static async Task EnsureProductSkuColumnAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Products') AND name = N'Sku')
                ALTER TABLE Products ADD Sku nvarchar(64) NULL
            """);
    }

    private static async Task EnsureProductReviewsTableAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'ProductReviews')
            CREATE TABLE ProductReviews (
                Id uniqueidentifier NOT NULL PRIMARY KEY,
                ProductId uniqueidentifier NOT NULL,
                UserId uniqueidentifier NOT NULL,
                Rating int NOT NULL,
                ReviewText nvarchar(max) NULL,
                CreatedAt datetime2 NOT NULL,
                UpdatedAt datetime2 NULL,
                CONSTRAINT FK_ProductReviews_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
                CONSTRAINT FK_ProductReviews_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
            )
            """);
    }

    private static async Task EnsureUserFavoritesTableAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'UserFavorites')
            CREATE TABLE UserFavorites (
                UserId uniqueidentifier NOT NULL,
                ProductId uniqueidentifier NOT NULL,
                CreatedAt datetime2 NOT NULL,
                CONSTRAINT PK_UserFavorites PRIMARY KEY (UserId, ProductId),
                CONSTRAINT FK_UserFavorites_Users FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
                CONSTRAINT FK_UserFavorites_Products FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
            )
            """);
    }

    private static async Task EnsureOrderIdempotencyKeyColumnAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Orders') AND name = N'IdempotencyKey')
                ALTER TABLE Orders ADD IdempotencyKey nvarchar(64) NULL
            """);
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_IdempotencyKey' AND object_id = OBJECT_ID(N'Orders'))
                CREATE UNIQUE INDEX IX_Orders_IdempotencyKey ON Orders(IdempotencyKey) WHERE IdempotencyKey IS NOT NULL
            """);
    }

    /// <summary>
    /// Adds NameEn and NameAr columns to Categories table if missing, and backfills from Name.
    /// </summary>
    private static async Task EnsureCategoryNameEnNameArColumnsAsync(ApplicationDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync("""
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Categories') AND name = N'NameEn')
                ALTER TABLE Categories ADD NameEn nvarchar(max) NOT NULL DEFAULT N'', NameAr nvarchar(max) NOT NULL DEFAULT N''
            """);
        await db.Database.ExecuteSqlRawAsync("""
            IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'Categories') AND name = N'NameEn')
                UPDATE Categories SET NameEn = ISNULL(Name, N''), NameAr = N'' WHERE NameEn = N'' OR NameAr = N''
            """);
    }
}
