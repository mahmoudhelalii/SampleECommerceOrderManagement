# E-Commerce Order Management System

.NET Web API + Angular with Clean Architecture, CQRS, JWT.

---

## Architecture (Senior-Level Choices)

### Backend (.NET 8) – Clean Architecture + CQRS

- **Domain** – Entities only (Product, Category, Order, OrderItem, User). No dependencies.
- **Application** – Use cases via CQRS (MediatR):
  - **Commands**: Login, Register, CreateProduct, UpdateProduct, CreateCategory, **CreateOrder** (with stock validation, discount, transaction).
  - **Queries**: GetProducts (pagination, search, filter by category, sort), GetProductById, GetCategories, GetOrderById.
  - **FluentValidation** for input validation; **ValidationBehavior** pipeline for MediatR.
  - **Result\<T\>** for success/failure; no exceptions for business rules.
- **Infrastructure** – EF Core 8, SQL Server, `ApplicationDbContext` implementing `IApplicationDbContext` (incl. `BeginTransactionAsync` for Unit of Work–style transactions). JWT generation via `IJwtService`.
- **API** – Thin controllers that send MediatR commands/queries; global **ExceptionMiddleware** (e.g. ValidationException → 400); **JWT Bearer** auth; **Swagger**; **CORS** for Angular origin; **camelCase** JSON.

Order creation: validate stock, apply discount (e.g. SAVE10/SAVE20), deduct stock, calculate total, all inside a **single database transaction**.

### Frontend (Angular 21)

- **Modular/feature structure**: `core` (auth, guards, interceptors, services), `features` (auth, products, cart, checkout, order-summary), `layout`, `shared` (notification toast).
- **Auth**: Login page, token in `localStorage`, **authGuard** and **adminGuard**, **JWT interceptor** attaching `Authorization: Bearer <token>`.
- **HTTP**: **Error notification interceptor** – maps API errors (401, 403, validation) to **global notifications**.
- **Global notification system**: Success / Error / Warning / Info; auto-dismiss (configurable); manual close; stacked toasts; triggered by API responses and interceptor.
- **Products**: List with **pagination**, **search**, **filter by category**, **sort** (Name/Price/Stock); product detail; add to cart.
- **Admin**: Create/Edit product (admin-only routes).
- **Cart** & **Checkout**: Cart page, checkout with optional discount code, place order, **order summary** page; success notification on order completion.

---

## How to Run (Quick – 2 days flow)

### Prerequisites

- .NET 8 SDK  
- SQL Server or LocalDB (for `(localdb)\mssqllocaldb`)

### 1. Backend

```bash
cd ECommerceOrderManagement
dotnet run --project src/OrderManagement.API
```

- API: **http://localhost:5109** (HTTP profile) or **https://localhost:7060** (HTTPS profile).
- Swagger: **http://localhost:5109/swagger** (prefer HTTP to avoid mixed content / 500 issues).
- DB: Uses LocalDB; on first run `EnsureCreated` creates the DB and seeds:
  - **Admin**: `admin@example.com` / `Admin@123`
  - **Customer**: `customer@example.com` / `Customer@123`
  - Categories: Electronics, Clothing
  - Sample products: Laptop, Mouse, T-Shirt
- Discount codes: `SAVE10` (10% off), `SAVE20` (20% off).

### 2. Frontend

```bash
cd client
npm install
npm start
```

- App: **http://localhost:4200**
- Set `apiUrl` in `client/src/environments/environment.ts` if your API runs on another port (e.g. 7060).

### 3. Test Flow

1. Open http://localhost:4200 → Products list (pagination, search, filter, sort).
2. Login as **customer@example.com** / **Customer@123** (or register).
3. Open a product → Add to cart → Cart → Checkout (optional: SAVE10) → Place order → Order summary + success notification.
4. Login as **admin@example.com** / **Admin@123** → “Add Product” → create/edit products.

---


## Troubleshooting

### Swagger shows "Failed to load API definition" (500 on swagger.json)

1. **Use the HTTP profile** so Swagger is at `http://localhost:5109/swagger`:
   ```bash
   dotnet run --project src/OrderManagement.API --launch-profile http
   ```
2. **See the real error**: Run the API from a terminal (stop it in Visual Studio first), then open `/swagger` in the browser. The terminal will show the exception that causes the 500 (e.g. schema generation or DB).
3. **Database**: If LocalDB isn’t installed, update `appsettings.json` connection string to a SQL Server instance you have, or install [LocalDB](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/sql-server-express-localdb).
