import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService, ProductDto, CategoryDto, PagedResult } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'products.title' | translate }}</h1>
    </div>
    <div class="filters mat-elevation-z1">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'products.search' | translate }}</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [(ngModel)]="search" (ngModelChange)="load(1)" [placeholder]="'products.searchPlaceholder' | translate" />
      </mat-form-field>
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'products.category' | translate }}</mat-label>
        <mat-select [(ngModel)]="categoryId" (ngModelChange)="load(1)">
          <mat-option value="">{{ 'products.allCategories' | translate }}</mat-option>
          @for (c of categories; track c.id) {
            <mat-option [value]="c.id">
              {{ translate.currentLang === 'ar'
                ? (c.nameAr || c.nameEn || '—')
                : (c.nameEn || c.nameAr || '—') }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>{{ 'products.sortBy' | translate }}</mat-label>
        <mat-select [(ngModel)]="sortBy" (ngModelChange)="load(1)">
          <mat-option value="Name">{{ 'products.name' | translate }}</mat-option>
          <mat-option value="Price">{{ 'products.price' | translate }}</mat-option>
          <mat-option value="Stock">{{ 'products.stock' | translate }}</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-checkbox [(ngModel)]="sortDesc" (ngModelChange)="load(1)">{{ 'products.desc' | translate }}</mat-checkbox>
    </div>
    @if (result() === null) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      @if ((result()?.items?.length ?? 0) > 0) {
        <div class="products-section">
          <button type="button" class="nav-arrow nav-arrow-left" [disabled]="page() <= 1" (click)="load(page() - 1)" aria-label="{{ 'products.prev' | translate }}">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <div class="grid">
            @for (p of result()?.items ?? []; track p.id) {
              <article class="product-card">
                <div class="product-image-wrap">
                  <span class="hot-badge">{{ 'products.hot' | translate }}</span>
                  @if (p.imageUrl && !failedImageIds().has(p.id)) {
                    <img class="product-image" [src]="api.getImageUrl(p.imageUrl)!" (error)="setImageFailed(p.id)" alt="" />
                  } @else {
                    <div class="product-avatar" aria-hidden="true"><mat-icon>inventory_2</mat-icon></div>
                  }
                  <a [routerLink]="['/products', p.id]" class="quick-view">{{ 'products.quickView' | translate }}</a>
                </div>
                <div class="product-info">
                  <span class="category-label">{{ 'products.categoryLabel' | translate }}</span>
                  <a [routerLink]="['/products', p.id]" class="product-name">
                    {{ translate.currentLang === 'ar'
                      ? (p.nameAr || p.nameEn || '—')
                      : (p.nameEn || p.nameAr || '—') }}
                  </a>
                  <div class="product-meta">
                    <span class="category-name">
                      {{ translate.currentLang === 'ar'
                        ? (p.categoryNameAr || p.categoryNameEn || '—')
                        : (p.categoryNameEn || p.categoryNameAr || '—') }}
                    </span>
                  </div>
                  <div class="stars" aria-hidden="true">
                    @for (s of [1,2,3,4,5]; track s) {
                      @let avg = p.averageRating ?? 0;
                      @let filled = s <= avg;
                      @let half = !filled && s - 0.5 <= avg;
                      <mat-icon class="star" [class.filled]="filled" [class.half]="half" [class.empty]="!filled && !half">{{ filled ? 'star' : (half ? 'star_half' : 'star_border') }}</mat-icon>
                    }
                  </div>
                  @if ((p.reviewCount ?? 0) > 0) {
                    <span class="review-count-list">({{ 'products.reviewsCount' | translate:{ count: p.reviewCount } }})</span>
                  }
                  <div class="price-row">
                    <span class="price">{{ p.price | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</span>
                    <button type="button" class="wishlist-btn" (click)="toggleWishlist(p.id); $event.preventDefault()" [class.filled]="wishlistIds().has(p.id)" aria-label="Wishlist">
                      <mat-icon>{{ wishlistIds().has(p.id) ? 'favorite' : 'favorite_border' }}</mat-icon>
                    </button>
                  </div>
                  @if (auth.isAdmin()) {
                    <p class="stock">{{ 'products.inStock' | translate }}: {{ p.stockQuantity }}</p>
                  }
                  @if (auth.isAdmin()) {
                    <a mat-stroked-button class="edit-link" [routerLink]="['/admin/products', p.id, 'edit']">{{ 'products.edit' | translate }}</a>
                  }
                </div>
              </article>
            }
          </div>
          <button type="button" class="nav-arrow nav-arrow-right" [disabled]="page() >= totalPages()" (click)="load(page() + 1)" aria-label="{{ 'products.next' | translate }}">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
        <div class="pagination">
          <span class="page-info">{{ 'products.pageOf' | translate:{ current: page(), total: totalPages() } }}</span>
        </div>
      } @else {
        <p class="no-results">{{ 'products.noResults' | translate }}</p>
      }
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; padding: 16px; border-radius: 8px; margin-bottom: 24px; background: #fff; }
    .filters mat-form-field { width: 180px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .products-section { position: relative; display: flex; align-items: stretch; gap: 0; margin-bottom: 24px; }
    .nav-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; width: 44px; height: 44px; border-radius: 50%; border: none; background: #e0e0e0; color: #555; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.12); }
    .nav-arrow:hover:not(:disabled) { background: #d0d0d0; color: #333; }
    .nav-arrow:disabled { opacity: 0.5; cursor: not-allowed; }
    .nav-arrow-left { left: -8px; }
    .nav-arrow-right { right: -8px; }
    .nav-arrow mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; flex: 1; padding: 0 40px; }
    @media (min-width: 1200px) { .grid { grid-template-columns: repeat(5, 1fr); } }
    .product-card { background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; display: flex; flex-direction: column; transition: box-shadow 0.2s; }
    .product-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .product-image-wrap { position: relative; width: 100%; aspect-ratio: 1; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .hot-badge { position: absolute; top: 10px; left: 10px; z-index: 1; background: #2e7d32; color: #fff; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; padding: 4px 8px; border-radius: 4px; }
    .product-image { width: 100%; height: 100%; object-fit: contain; }
    .product-avatar { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e8e8e8; color: #9e9e9e; }
    .product-avatar mat-icon { font-size: 56px; width: 56px; height: 56px; }
    .quick-view { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.5); color: #fff; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-decoration: none; opacity: 0; transition: opacity 0.2s; }
    .product-image-wrap:hover .quick-view { opacity: 1; }
    .product-info { padding: 14px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .category-label { font-size: 0.7rem; color: #9e9e9e; text-transform: uppercase; letter-spacing: 0.04em; }
    .product-name { font-size: 0.95rem; font-weight: 600; color: #333; text-decoration: none; display: block; line-height: 1.3; }
    .product-name:hover { color: #006a6a; text-decoration: underline; }
    .product-meta { font-size: 0.8rem; color: #757575; }
    .stars { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; margin: 6px 0 4px; }
    .stars .star { font-size: 16px; width: 16px; height: 16px; }
    .stars .star.filled, .stars .star.half { color: #f9a825; }
    .stars .star.empty { color: #e0e0e0; }
    .review-count-list { font-size: 0.75rem; color: #757575; margin-inline-start: 4px; }
    .price-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
    .price { font-weight: 700; font-size: 1.05rem; color: #333; }
    .wishlist-btn { border: none; background: none; cursor: pointer; padding: 4px; color: #9e9e9e; display: flex; align-items: center; justify-content: center; }
    .wishlist-btn:hover { color: #e91e63; }
    .wishlist-btn.filled { color: #e91e63; }
    .wishlist-btn mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .stock { font-size: 0.8rem; color: #888; margin: 4px 0 0; }
    .edit-link { margin-top: 8px; align-self: flex-start; }
    .pagination { display: flex; align-items: center; justify-content: center; margin-top: 16px; }
    .page-info { font-size: 0.95rem; color: #666; }
    .no-results { text-align: center; color: #666; font-size: 1.1rem; margin: 48px 0; }
  `],
})
export class ProductListComponent implements OnInit {
  result = signal<PagedResult<ProductDto> | null>(null);
  failedImageIds = signal<Set<string>>(new Set());
  wishlistIds = signal<Set<string>>(new Set());
  categories: CategoryDto[] = [];
  search = '';
  categoryId = '';
  sortBy = 'Name';
  sortDesc = false;
  page = signal(1);
  pageSize = 10;
  constructor(
    public api: ApiService,
    public translate: TranslateService,
    public auth: AuthService,
    private notifications: NotificationService,
  ) {}

  setImageFailed(id: string): void {
    this.failedImageIds.update(s => new Set(s).add(id));
  }

  toggleWishlist(id: string): void {
    if (!this.auth.isLoggedIn()) {
      this.notifications.warning(this.translate.instant('products.loginToSaveFavorites'));
      return;
    }
    const isFav = this.wishlistIds().has(id);
    if (isFav) {
      this.api.removeFavorite(id).subscribe({
        next: () => this.wishlistIds.update(s => { const next = new Set(s); next.delete(id); return next; }),
        error: () => this.notifications.warning(this.translate.instant('notifications.errorOccurred')),
      });
    } else {
      this.api.addFavorite(id).subscribe({
        next: () => this.wishlistIds.update(s => new Set(s).add(id)),
        error: () => this.notifications.warning(this.translate.instant('notifications.errorOccurred')),
      });
    }
  }

  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });

  ngOnInit(): void {
    this.api.getCategories().subscribe(c => (this.categories = c));
    if (this.auth.isLoggedIn()) {
      this.api.getFavorites().subscribe({
        next: ids => this.wishlistIds.set(new Set(ids)),
        error: () => {},
      });
    }
    this.load(1);
  }

  load(p: number): void {
    this.page.set(p);
    this.api
      .getProducts({
        page: p,
        pageSize: this.pageSize,
        search: this.search || undefined,
        categoryId: this.categoryId || undefined,
        sortBy: this.sortBy,
        sortDesc: this.sortDesc,
      })
      .subscribe(r => this.result.set(r));
  }

}
