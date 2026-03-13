import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', canActivate: [homeRedirectGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent) },
      { path: 'products/:id', loadComponent: () => import('./features/products/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
      { path: 'cart', canActivate: [authGuard], loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent) },
      { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./features/orders/orders-list/orders-list.component').then(m => m.OrdersListComponent) },
      { path: 'order/:id', canActivate: [authGuard], loadComponent: () => import('./features/order-summary/order-summary.component').then(m => m.OrderSummaryComponent) },
      { path: 'admin/products/new', loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent), canActivate: [adminGuard] },
      { path: 'admin/products/:id/edit', loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent), canActivate: [adminGuard] },
      { path: 'admin/categories', loadComponent: () => import('./features/categories/category-list/category-list.component').then(m => m.CategoryListComponent), canActivate: [adminGuard] },
      { path: 'admin/categories/new', loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent), canActivate: [adminGuard] },
      { path: 'admin/categories/:id/edit', loadComponent: () => import('./features/categories/category-form/category-form.component').then(m => m.CategoryFormComponent), canActivate: [adminGuard] },
      { path: 'admin/reports/products', loadComponent: () => import('./features/reports/products-report/products-report.component').then(m => m.ProductsReportComponent), canActivate: [adminGuard] },
      { path: 'admin/users', loadComponent: () => import('./features/admin/users-list/users-list.component').then(m => m.UsersListComponent), canActivate: [adminGuard] },
    ]
  },
  { path: '**', redirectTo: 'products' }
];
