import { Component, OnInit, OnDestroy, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService, ProductDto, ProductReviewDto } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    @if (product()) {
      <div class="detail-layout">
        <div class="detail-left">
          <div class="main-image-wrap">
            <span class="hot-badge">{{ 'products.hot' | translate }}</span>
            @if (product()!.imageUrl && !productImageError()) {
              <img class="main-image" [src]="api.getImageUrl(product()!.imageUrl)!" (error)="productImageError.set(true)" alt="" />
            } @else {
              <div class="product-avatar"><mat-icon>inventory_2</mat-icon></div>
            }
          </div>
          <div class="thumbnails">
            @if (product()!.imageUrl && !productImageError()) {
              <button type="button" class="thumb active" (click)="selectedImageIndex.set(0)">
                <img [src]="api.getImageUrl(product()!.imageUrl)!" alt="" />
              </button>
            }
          </div>
        </div>
        <div class="detail-right">
          <h1 class="product-name">
            {{ translate.currentLang === 'ar'
              ? (product()!.nameAr || product()!.nameEn || '—')
              : (product()!.nameEn || product()!.nameAr || '—') }}
          </h1>
          <div class="rating-row">
            <span class="stars" aria-hidden="true">
              @for (s of starArray(); track s) {
                <mat-icon class="star">{{ s <= (product()!.averageRating ?? 0) ? 'star' : (s - 0.5 <= (product()!.averageRating ?? 0) ? 'star_half' : 'star_border') }}</mat-icon>
              }
            </span>
            <span class="review-count">({{ 'products.reviewsCount' | translate:{ count: product()!.reviewCount ?? 0 } }})</span>
          </div>
          <p class="price">{{ product()!.price | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</p>
          <p class="desc">{{ translate.currentLang === 'ar' ? (product()!.descriptionAr || product()!.descriptionEn || '—') : (product()!.descriptionEn || product()!.descriptionAr || '—') }}</p>
          @if (product()!.sku) {
            <p class="meta"><span class="meta-label">{{ 'products.sku' | translate }}:</span> <strong>{{ product()!.sku }}</strong></p>
          }
          <p class="meta"><span class="meta-label">{{ 'products.categoryLabel' | translate }}:</span> <strong>{{ translate.currentLang === 'ar' ? (product()!.categoryNameAr || product()!.categoryNameEn || '—') : (product()!.categoryNameEn || product()!.categoryNameAr || '—') }}</strong></p>
          @if (auth.isAdmin()) {
            <p class="stock">{{ 'products.inStock' | translate }}: {{ product()!.stockQuantity }}</p>
          }
          @if (!auth.isAdmin()) {
            @if (product()!.stockQuantity <= 0) {
              <p class="out-of-stock-msg">{{ 'products.outOfStock' | translate }}</p>
            } @else {
              <div class="qty-cart">
                <div class="qty-controls">
                  <button type="button" class="qty-btn" (click)="qty = Math.max(1, qty - 1)">−</button>
                  <input type="number" class="qty-input" [(ngModel)]="qty" min="1" [max]="product()!.stockQuantity" />
                  <button type="button" class="qty-btn" (click)="qty = Math.min(product()!.stockQuantity, qty + 1)">+</button>
                </div>
                <button type="button" class="add-cart-btn" (click)="addToCart()">
                  <mat-icon>shopping_bag</mat-icon>
                  {{ 'products.addToCart' | translate }}
                </button>
              </div>
            }
          }
          <div class="share-wishlist">
            <button type="button" class="wishlist-link" (click)="toggleWishlist()">
              <mat-icon>{{ inWishlist() ? 'favorite' : 'favorite_border' }}</mat-icon>
              {{ 'products.addToWishlist' | translate }}
            </button>
          </div>
          <div class="back-edit">
            <a mat-button routerLink="/products"><mat-icon>arrow_back</mat-icon> {{ 'products.backToList' | translate }}</a>
            @if (auth.isAdmin()) {
              <a mat-flat-button color="primary" [routerLink]="['/admin/products', product()!.id, 'edit']">{{ 'products.edit' | translate }}</a>
            }
          </div>
        </div>
      </div>

      <section class="reviews-section">
        <h2 class="reviews-title">{{ 'products.reviews' | translate }} ({{ reviews().length }})</h2>
        @if (auth.isLoggedIn() && !reviewSubmitting()) {
          <div class="add-review">
            <p class="form-label">{{ 'products.writeReview' | translate }}</p>
            <p class="form-label">{{ 'products.yourRating' | translate }}</p>
            <div class="star-input">
              @for (r of [1,2,3,4,5]; track r) {
                <button type="button" class="star-btn" (click)="newRating.set(r)" [class.active]="r <= newRating()">
                  <mat-icon>{{ r <= newRating() ? 'star' : 'star_border' }}</mat-icon>
                </button>
              }
            </div>
            <mat-form-field appearance="outline" class="review-text">
              <mat-label>{{ 'products.yourReview' | translate }}</mat-label>
              <textarea matInput [(ngModel)]="newReviewText" rows="3"></textarea>
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="submitReview()" [disabled]="newRating() < 1">{{ 'products.submitReview' | translate }}</button>
          </div>
        } @else if (!auth.isLoggedIn()) {
          <p class="login-hint">{{ 'products.loginToReview' | translate }}</p>
        }
        <div class="reviews-list">
          @for (r of reviews(); track r.id) {
            <div class="review-card">
              <div class="review-header">
                <span class="review-stars">
                  @for (s of [1,2,3,4,5]; track s) {
                    <mat-icon class="star small">{{ s <= r.rating ? 'star' : 'star_border' }}</mat-icon>
                  }
                </span>
                <span class="review-user">{{ r.userName }}</span>
                <span class="review-date">{{ r.createdAt | date:'mediumDate' }}</span>
              </div>
              @if (r.reviewText) {
                <p class="review-text">{{ r.reviewText }}</p>
              }
            </div>
          }
        </div>
      </section>
    } @else if (loading()) {
      <div class="loading"><mat-spinner></mat-spinner></div>
    } @else {
      <div class="not-found">
        <p>{{ 'products.notFound' | translate }}</p>
        <a mat-button routerLink="/products">{{ 'products.backToList' | translate }}</a>
      </div>
    }
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; max-width: 1000px; margin-bottom: 48px; align-items: start; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }
    .detail-left { position: sticky; top: 24px; }
    .main-image-wrap { position: relative; aspect-ratio: 1; background: #f8f9fa; border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
    .hot-badge { position: absolute; top: 12px; left: 12px; z-index: 1; background: #2e7d32; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 6px 10px; border-radius: 20px; }
    .main-image { width: 100%; height: 100%; object-fit: contain; }
    .product-avatar { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #e8e8e8; color: #9e9e9e; }
    .product-avatar mat-icon { font-size: 80px; width: 80px; height: 80px; }
    .thumbnails { display: flex; gap: 8px; flex-wrap: wrap; }
    .thumb { width: 64px; height: 64px; padding: 0; border: 2px solid #ddd; border-radius: 6px; overflow: hidden; cursor: pointer; background: #fff; }
    .thumb.active { border-color: #333; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .detail-right { display: flex; flex-direction: column; gap: 12px; }
    .product-name { font-size: 1.75rem; font-weight: 700; color: #333; margin: 0 0 8px; }
    .rating-row { display: flex; align-items: center; gap: 8px; }
    .stars .star { color: #f9a825; font-size: 22px; width: 22px; height: 22px; }
    .review-count { color: #757575; font-size: 0.9rem; }
    .price { font-size: 1.5rem; font-weight: 700; color: #333; margin: 8px 0; }
    .desc { color: #555; font-size: 0.95rem; line-height: 1.5; margin: 0; }
    .meta { font-size: 0.9rem; color: #757575; margin: 4px 0; }
    .meta-label { text-transform: uppercase; letter-spacing: 0.04em; }
    .stock { font-size: 0.9rem; color: #666; margin: 4px 0; }
    .out-of-stock-msg { font-size: 1rem; color: #c62828; margin: 12px 0; font-weight: 500; }
    .qty-cart { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 8px; }
    .qty-controls { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
    .qty-btn { width: 40px; height: 44px; border: none; background: #f5f5f5; cursor: pointer; font-size: 1.2rem; }
    .qty-btn:hover { background: #eee; }
    .qty-input { width: 56px; height: 44px; text-align: center; border: none; border-inline: 1px solid #ddd; font-size: 1rem; }
    .add-cart-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #333; color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .add-cart-btn:hover { background: #555; }
    .add-cart-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .share-wishlist { margin-top: 8px; }
    .wishlist-link { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #666; cursor: pointer; font-size: 0.9rem; padding: 4px 0; }
    .wishlist-link:hover { color: #e91e63; }
    .wishlist-link mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .back-edit { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; }
    .reviews-section { max-width: 1000px; border-top: 1px solid #eee; padding-top: 32px; }
    .reviews-title { font-size: 1.25rem; margin: 0 0 20px; }
    .add-review { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
    .form-label { margin: 0 0 8px; font-size: 0.9rem; }
    .star-input { display: flex; gap: 4px; margin-bottom: 16px; }
    .star-btn { border: none; background: none; cursor: pointer; padding: 0; color: #ddd; }
    .star-btn:hover, .star-btn.active { color: #f9a825; }
    .star-btn mat-icon { font-size: 28px; width: 28px; height: 28px; }
    .review-text { width: 100%; max-width: 400px; display: block; }
    .login-hint { color: #666; margin-bottom: 20px; }
    .reviews-list { display: flex; flex-direction: column; gap: 16px; }
    .review-card { padding: 16px; background: #fff; border: 1px solid #eee; border-radius: 8px; }
    .review-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; }
    .review-stars .star { color: #f9a825; font-size: 18px; width: 18px; height: 18px; }
    .review-user { font-weight: 600; }
    .review-date { color: #757575; font-size: 0.85rem; }
    .review-card .review-text { margin: 0; color: #555; font-size: 0.95rem; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .not-found { text-align: center; padding: 48px; }
  `],
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product = signal<ProductDto | null>(null);
  productImageError = signal(false);
  loading = signal(true);
  reviews = signal<ProductReviewDto[]>([]);
  selectedImageIndex = signal(0);
  qty = 1;
  newRating = signal(0);
  newReviewText = '';
  reviewSubmitting = signal(false);
  wishlistIds = signal<Set<string>>(new Set());
  private langSub: ReturnType<TranslateService['onLangChange']['subscribe']> | null = null;

  public translate = inject(TranslateService);
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public api: ApiService,
    public auth: AuthService,
    private breadcrumb: BreadcrumbService,
    private cart: CartService,
    private notifications: NotificationService,
  ) {}

  readonly Math = Math;

  starArray = computed(() => [1, 2, 3, 4, 5]);

  inWishlist = computed(() => {
    const p = this.product();
    return p ? this.wishlistIds().has(p.id) : false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.api.getProduct(id).subscribe({
      next: p => {
        this.product.set(p);
        this.loading.set(false);
        this.updateBreadcrumbLabel(p);
        this.loadReviews(id);
        if (this.auth.isLoggedIn()) {
          this.api.getFavorites().subscribe({
            next: ids => this.wishlistIds.set(new Set(ids)),
            error: () => {},
          });
        }
      },
      error: () => this.loading.set(false),
    });
    this.langSub = this.translate.onLangChange.subscribe(() => {
      const p = this.product();
      if (p) this.updateBreadcrumbLabel(p);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private updateBreadcrumbLabel(p: ProductDto): void {
    const name = this.translate.currentLang === 'ar' ? (p.nameAr || p.nameEn || '') : (p.nameEn || p.nameAr || '');
    this.breadcrumb.setCustomLabel(name || '—');
  }

  loadReviews(productId: string): void {
    this.api.getProductReviews(productId).subscribe({
      next: list => this.reviews.set(list),
      error: () => this.reviews.set([]),
    });
  }

  addToCart(): void {
    if (!this.auth.isLoggedIn()) {
      this.notifications.warning(this.translate.instant('auth.loginRequiredToAddToCart'));
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const p = this.product();
    if (!p) return;
    if (this.qty < 1 || this.qty > p.stockQuantity) {
      this.notifications.warning(this.translate.instant('notifications.invalidQuantity'));
      return;
    }
    this.cart.add(p, this.qty);
    this.notifications.success(this.translate.instant('notifications.addedToCart'));
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isLoggedIn()) {
      this.notifications.warning(this.translate.instant('products.loginToSaveFavorites'));
      return;
    }
    const isFav = this.wishlistIds().has(p.id);
    if (isFav) {
      this.api.removeFavorite(p.id).subscribe({
        next: () => this.wishlistIds.update(s => { const next = new Set(s); next.delete(p.id); return next; }),
        error: () => this.notifications.warning(this.translate.instant('notifications.errorOccurred')),
      });
    } else {
      this.api.addFavorite(p.id).subscribe({
        next: () => this.wishlistIds.update(s => new Set(s).add(p.id)),
        error: () => this.notifications.warning(this.translate.instant('notifications.errorOccurred')),
      });
    }
  }

  submitReview(): void {
    const p = this.product();
    if (!p || this.newRating() < 1) return;
    this.reviewSubmitting.set(true);
    this.api.createProductReview(p.id, { rating: this.newRating(), reviewText: this.newReviewText || null }).subscribe({
      next: review => {
        this.reviews.update(list => [...list, review]);
        this.newRating.set(0);
        this.newReviewText = '';
        this.reviewSubmitting.set(false);
        this.notifications.success(this.translate.instant('products.reviewSubmitted'));
      },
      error: err => {
        this.reviewSubmitting.set(false);
        const msg = err.error?.errors?.[0] || err.message || 'Failed to submit review.';
        this.notifications.warning(msg);
      },
    });
  }
}
