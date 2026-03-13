import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { CartService } from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'checkout.title' | translate }}</h1>
    </div>
    @if (cart.items().length === 0) {
      <mat-card class="mat-elevation-z2">
        <mat-card-content>
          <p>{{ 'checkout.cartEmpty' | translate }}</p>
          <a mat-button routerLink="/cart">{{ 'checkout.viewCart' | translate }}</a>
        </mat-card-content>
      </mat-card>
    } @else {
      <mat-card class="checkout-card mat-elevation-z2">
        <mat-card-header>
          <mat-card-title>{{ 'checkout.orderSummary' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'checkout.discountCode' | translate }}</mat-label>
            <input matInput [(ngModel)]="discountCode" [placeholder]="'checkout.discountPlaceholder' | translate" />
          </mat-form-field>
          <p class="subtotal">{{ 'checkout.subtotal' | translate }}: {{ cart.totalAmount() | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</p>
          <button mat-flat-button color="primary" (click)="placeOrder()" [disabled]="loading">
            @if (loading) {
              <mat-spinner diameter="24"></mat-spinner>
            } @else {
              {{ 'checkout.placeOrder' | translate }}
            }
          </button>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .checkout-card { max-width: 420px; }
    .full-width { width: 100%; display: block; }
    .subtotal { font-size: 1.1rem; margin: 16px 0; }
    button mat-spinner { margin: 0 auto; }
  `],
})
export class CheckoutComponent {
  discountCode = '';
  loading = false;
  private translate = inject(TranslateService);

  constructor(
    public cart: CartService,
    private api: ApiService,
    private router: Router,
    private notifications: NotificationService,
  ) {}

  placeOrder(): void {
    if (this.cart.items().length === 0 || this.loading) return;
    this.loading = true;
    const items = this.cart.items().map(i => ({ productId: i.product.id, quantity: i.quantity }));
    const idempotencyKey = crypto.randomUUID();
    this.api
      .createOrder(
        {
          discountCode: this.discountCode.trim() || undefined,
          items,
        },
        idempotencyKey,
      )
      .subscribe({
        next: res => {
          this.cart.clear();
          this.notifications.success(this.translate.instant('notifications.orderPlaced'));
          this.router.navigate(['/order', res.orderId]);
        },
        error: () => (this.loading = false),
      });
  }
}
