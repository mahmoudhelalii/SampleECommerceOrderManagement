import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService, OrderDetailDto } from '../../core/services/api.service';
import { OrderStatusPipe } from '../../core/pipes/order-status.pipe';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslateModule,
    OrderStatusPipe,
  ],
  template: `
    @if (order()) {
      <div class="page-header">
        <h1>{{ 'order.orderId' | translate:{ id: order()!.id } }}</h1>
        <mat-chip-set>
          <mat-chip [class.status-approved]="order()!.status === 'Approved'">{{ order()!.status | orderStatus }}</mat-chip>
        </mat-chip-set>
      </div>
      <mat-card class="order-card mat-elevation-z2">
        <mat-card-content>
          <table mat-table [dataSource]="order()!.items" class="order-table">
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>{{ 'order.product' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.productName }}</td>
            </ng-container>
            <ng-container matColumnDef="qty">
              <th mat-header-cell *matHeaderCellDef>{{ 'order.qty' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.quantity }}</td>
            </ng-container>
            <ng-container matColumnDef="unitPrice">
              <th mat-header-cell *matHeaderCellDef>{{ 'order.unitPrice' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.unitPrice | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</td>
            </ng-container>
            <ng-container matColumnDef="lineTotal">
              <th mat-header-cell *matHeaderCellDef>{{ 'order.total' | translate }}</th>
              <td mat-cell *matCellDef="let item">{{ item.lineTotal | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
          <div class="totals">
            <p>{{ 'order.subtotal' | translate }}: {{ order()!.subTotal | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</p>
            <p>{{ 'order.discount' | translate }}: {{ order()!.discountAmount | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</p>
            <p class="total">{{ 'order.total' | translate }}: {{ order()!.totalAmount | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</p>
          </div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-flat-button color="primary" routerLink="/products">
            <mat-icon>shopping_bag</mat-icon>
            {{ 'order.continueShopping' | translate }}
          </a>
        </mat-card-actions>
      </mat-card>
    } @else {
      <div class="loading"><mat-spinner></mat-spinner></div>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .order-card { overflow: hidden; }
    .order-table { width: 100%; }
    .totals { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; }
    .totals p { margin: 4px 0; }
    .total { font-size: 1.25rem; font-weight: 600; }
    .loading { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  order = signal<OrderDetailDto | null>(null);
  displayedColumns = ['product', 'qty', 'unitPrice', 'lineTotal'];
  private langSub: ReturnType<TranslateService['onLangChange']['subscribe']> | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private breadcrumb: BreadcrumbService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.api.getOrder(id).subscribe(o => {
      this.order.set(o);
      this.updateBreadcrumbLabel(o.id);
    });
    this.langSub = this.translate.onLangChange.subscribe(() => {
      const o = this.order();
      if (o) this.updateBreadcrumbLabel(o.id);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  private updateBreadcrumbLabel(orderId: string): void {
    this.breadcrumb.setCustomLabel(this.translate.instant('order.orderId', { id: orderId }));
  }
}
