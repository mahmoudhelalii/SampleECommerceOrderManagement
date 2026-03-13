import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { OrderStatusPipe } from '../../../core/pipes/order-status.pipe';
import { ApiService, OrderListItemDto, PagedResult } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslateModule,
    OrderStatusPipe,
  ],
  template: `
    <div class="page-header">
      <h1>{{ auth.isAdmin() ? ('orders.titleAdmin' | translate) : ('orders.title' | translate) }}</h1>
    </div>
    <mat-card class="list-card mat-elevation-z2">
      <mat-card-content>
        @if (result() === null) {
          <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
        } @else if (result()!.items.length === 0) {
          <p class="empty">{{ 'orders.empty' | translate }}</p>
        } @else {
          <table mat-table [dataSource]="result()!.items" class="orders-table">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>{{ 'orders.orderIdShort' | translate }}</th>
              <td mat-cell *matCellDef="let row">
                <a [routerLink]="['/order', row.id]">{{ row.id | slice:0:8 }}…</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>{{ 'orders.date' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ 'order.status' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.status | orderStatus }}</td>
            </ng-container>
            <ng-container matColumnDef="totalAmount">
              <th mat-header-cell *matHeaderCellDef>{{ 'order.total' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.totalAmount | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</td>
            </ng-container>
            <ng-container matColumnDef="view">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <a mat-flat-button color="primary" [routerLink]="['/order', row.id]">{{ 'products.view' | translate }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="cancel">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                @if (row.status !== 'Cancelled') {
                  <button mat-stroked-button color="warn" (click)="cancel(row.id)">{{ 'orders.cancel' | translate }}</button>
                }
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
          <div class="pagination">
            <button mat-flat-button [disabled]="page() <= 1" (click)="load(page() - 1)">{{ 'products.prev' | translate }}</button>
            <span class="page-info">{{ 'products.pageOf' | translate:{ current: page(), total: totalPages() } }}</span>
            <button mat-flat-button [disabled]="page() >= totalPages()" (click)="load(page() + 1)">{{ 'products.next' | translate }}</button>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .list-card { overflow: hidden; }
    .orders-table { width: 100%; }
    .orders-table a { color: inherit; text-decoration: none; }
    .orders-table a:hover { text-decoration: underline; }
    .empty { margin: 24px 0; color: #666; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .pagination { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
    .page-info { font-size: 0.95rem; }
  `],
})
export class OrdersListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  public auth = inject(AuthService);

  result = signal<PagedResult<OrderListItemDto> | null>(null);
  page = signal(1);
  pageSize = 10;
  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });
  displayedColumns = ['id', 'createdAt', 'status', 'totalAmount', 'view', 'cancel'];
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  ngOnInit(): void {
    this.load(1);
  }

  cancel(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.translate.instant('orders.confirmCancelTitle'),
        message: this.translate.instant('orders.confirmCancelMessage'),
      },
      width: '400px',
    });
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.cancelOrder(id).subscribe({
          next: () => {
            this.notifications.success(this.translate.instant('notifications.orderCancelled'));
            this.load(this.page());
          },
          error: () => this.notifications.warning(this.translate.instant('notifications.errorOccurred')),
        });
      }
    });
  }

  load(p: number): void {
    this.page.set(p);
    this.api.getOrders({ page: p, pageSize: this.pageSize }).subscribe({
      next: data => this.result.set(data),
      error: () => this.result.set({ items: [], totalCount: 0, page: p, pageSize: this.pageSize }),
    });
  }
}
