import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'cart.title' | translate }}</h1>
    </div>
    @if (cart.items().length === 0) {
      <mat-card class="empty-card mat-elevation-z2">
        <mat-card-content>
          <p>{{ 'cart.empty' | translate }}</p>
          <a mat-flat-button color="primary" routerLink="/products">{{ 'cart.browseProducts' | translate }}</a>
        </mat-card-content>
      </mat-card>
    } @else {
      <mat-card class="cart-card mat-elevation-z2">
        <mat-card-content>
          <table mat-table [dataSource]="cart.items()" class="cart-table">
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>{{ 'cart.product' | translate }}</th>
              <td mat-cell *matCellDef="let item">
                <a [routerLink]="['/products', item.product.id]">
                  <span class="name-line">{{ 'products.nameAr' | translate }}: {{ item.product.nameAr || '—' }}</span>
                  <span class="name-line">{{ 'products.nameEn' | translate }}: {{ item.product.nameEn || '—' }}</span>
                </a>
              </td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.price' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.product.price | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</td>
            </ng-container>
            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>{{ 'cart.qty' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>{{ 'cart.total' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.product.price * item.quantity | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button color="warn" (click)="cart.remove(item.product.id)" [attr.aria-label]="'cart.remove' | translate">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <p class="total">{{ 'cart.total' | translate }}: {{ cart.totalAmount() | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</p>
        </mat-card-content>
        <mat-card-actions>
          <a mat-flat-button color="primary" routerLink="/checkout">{{ 'cart.proceedToCheckout' | translate }}</a>
        </mat-card-actions>
      </mat-card>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .empty-card { max-width: 400px; }
    .empty-card p { margin-bottom: 16px; }
    .cart-card { overflow: hidden; }
    .cart-table { width: 100%; }
  .name-line { display: block; }
    .cart-table a { color: inherit; text-decoration: none; }
    .cart-table a:hover { text-decoration: underline; }
    .total { font-size: 1.25rem; font-weight: 600; margin: 16px 0 0; }
  `],
})
export class CartComponent {
  displayedColumns = ['product', 'price', 'qty', 'total', 'actions'];
  constructor(public cart: CartService) {}
}
