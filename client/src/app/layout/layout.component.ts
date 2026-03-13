import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { LocaleService } from '../core/services/locale.service';
import { BreadcrumbComponent } from '../shared/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    BreadcrumbComponent,
  ],
  template: `
    <mat-toolbar color="primary" class="toolbar" [attr.dir]="locale.currentLang === 'ar' ? 'rtl' : 'ltr'">
      <a mat-button routerLink="/" class="logo">
        <img src="/logo.png" alt="{{ 'app.title' | translate }}" class="logo-img" />
      </a>
      @if (auth.isAdmin()) {
        <a mat-button routerLink="/dashboard" routerLinkActive="active">
          <span class="nav-item">
            <mat-icon>dashboard</mat-icon>
            <span class="nav-text">{{ 'nav.dashboard' | translate }}</span>
          </span>
        </a>
      }
      <a mat-button routerLink="/products" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: false }">
        <span class="nav-item">
          <mat-icon>inventory_2</mat-icon>
          <span class="nav-text">{{ 'nav.products' | translate }}</span>
        </span>
      </a>
      <a mat-button routerLink="/cart" routerLinkActive="active">
        <span class="nav-item">
          <mat-icon>shopping_cart</mat-icon>
          <span class="nav-text">{{ 'nav.cart' | translate }} ({{ cart.totalItems() }})</span>
        </span>
      </a>
      @if (auth.isLoggedIn()) {
        <a mat-button routerLink="/orders" routerLinkActive="active">
          <span class="nav-item">
            <mat-icon>receipt_long</mat-icon>
            <span class="nav-text">{{ auth.isAdmin() ? ('nav.ordersAdmin' | translate) : ('nav.orders' | translate) }}</span>
          </span>
        </a>
      }
      @if (auth.isAdmin()) {
        <a mat-button routerLink="/admin/categories" routerLinkActive="active">
          <span class="nav-item">
            <mat-icon>category</mat-icon>
            <span class="nav-text">{{ 'nav.categories' | translate }}</span>
          </span>
        </a>
        <a mat-button routerLink="/admin/products/new" routerLinkActive="active">
          <span class="nav-item">
            <mat-icon>add_box</mat-icon>
            <span class="nav-text">{{ 'nav.addProduct' | translate }}</span>
          </span>
        </a>
        <a mat-button routerLink="/admin/reports/products" routerLinkActive="active">
          <span class="nav-item">
            <mat-icon>assessment</mat-icon>
            <span class="nav-text">{{ 'nav.productsReport' | translate }}</span>
          </span>
        </a>
        <a mat-button routerLink="/admin/users" routerLinkActive="active">
          <span class="nav-item">
            <mat-icon>people</mat-icon>
            <span class="nav-text">{{ 'nav.users' | translate }}</span>
          </span>
        </a>
      }
      <span class="spacer"></span>
      @if (auth.isLoggedIn()) {
        <span class="user-name">{{ locale.currentLang === 'ar' && auth.isAdmin() ? ('nav.adminUserName' | translate) : (auth.currentUser()?.fullName ?? '') }}</span>
        <button mat-button (click)="auth.logout()">
          <span class="nav-item">
            <mat-icon>logout</mat-icon>
            <span class="nav-text">{{ 'nav.logout' | translate }}</span>
          </span>
        </button>
      } @else {
        <a mat-button routerLink="/login">
          <span class="nav-item">
            <mat-icon>login</mat-icon>
            <span class="nav-text">{{ 'nav.login' | translate }}</span>
          </span>
        </a>
      }
      <button mat-button (click)="locale.toggleLanguage()" class="lang-btn">
        <span class="nav-item">
          <mat-icon>language</mat-icon>
          <span class="nav-text">{{ locale.currentLang === 'ar' ? 'English' : 'العربية' }}</span>
        </span>
      </button>
    </mat-toolbar>
    <app-breadcrumb />
    <main class="main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 0;
      padding: 0 8px;
      background-color: #006a6a !important;
      color: #fff;
    }
    .toolbar a[mat-button],
    .toolbar button[mat-button] {
      min-width: auto;
      padding: 0 16px;
      margin: 0 2px;
    }
    .main-content {
      padding: 24px;
      max-width: 1400px;
      margin-inline: auto;
      text-align: start;
      background-color: white;
    }
    .nav-item {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      white-space: nowrap;
      padding: 0 4px;
    }
    .nav-item mat-icon {
      flex-shrink: 0;
      width: 24px;
      min-width: 24px;
      height: 24px;
      font-size: 24px;
      line-height: 24px;
      margin-inline-end: 2px;
      overflow: visible;
    }
    .nav-text {
      flex-shrink: 0;
      margin-inline-start: 2px;
      letter-spacing: 0.02em;
    }
    .toolbar .logo { padding: 4px 12px; display: flex; align-items: center; }
    .toolbar .logo-img { height: 40px; width: auto; display: block; object-fit: contain; }
    .spacer { flex: 1 1 auto; min-width: 24px; }
    .user-name {
      margin: 0;
      padding-inline: 12px;
      font-size: 0.9rem;
      white-space: nowrap;
      color: #fff;
    }
    :host ::ng-deep .toolbar .mat-mdc-button .mat-icon,
    :host ::ng-deep .toolbar .mat-mdc-button .mdc-button__label,
    :host ::ng-deep .toolbar a[mat-button],
    :host ::ng-deep .toolbar button[mat-button] { color: #fff; }
    .lang-btn { margin-inline-start: 8px; }
    :host ::ng-deep .toolbar a.active { background: rgba(0,0,0,0.12); }
    :host ::ng-deep .toolbar a[mat-button]:hover:not(.active),
    :host ::ng-deep .toolbar button[mat-button]:hover { background: rgba(255,255,255,0.08); }
    :host ::ng-deep .toolbar .mat-mdc-button .mdc-button__label { overflow: visible; }
  `],
})
export class LayoutComponent {
  constructor(public auth: AuthService, public cart: CartService, public locale: LocaleService) {}
}
