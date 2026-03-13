import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService, DashboardStatsDto } from '../../core/services/api.service';
import { OrderStatusPipe } from '../../core/pipes/order-status.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
    OrderStatusPipe,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'dashboard.title' | translate }}</h1>
    </div>
    @if (stats() === null) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else {
      <div class="stats-grid">
        <mat-card class="stat-card orders">
          <mat-card-content>
            <mat-icon class="stat-icon">receipt_long</mat-icon>
            <div class="stat-value">{{ stats()!.totalOrders }}</div>
            <div class="stat-label">{{ 'dashboard.totalOrders' | translate }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card revenue">
          <mat-card-content>
            <mat-icon class="stat-icon">payments</mat-icon>
            <div class="stat-value">{{ stats()!.totalRevenue | number:'1.2-2' }} {{ 'currency.riyal' | translate }}</div>
            <div class="stat-label">{{ 'dashboard.totalRevenue' | translate }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card products">
          <mat-card-content>
            <mat-icon class="stat-icon">inventory_2</mat-icon>
            <div class="stat-value">{{ stats()!.totalProducts }}</div>
            <div class="stat-label">{{ 'dashboard.totalProducts' | translate }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card categories">
          <mat-card-content>
            <mat-icon class="stat-icon">category</mat-icon>
            <div class="stat-value">{{ stats()!.totalCategories }}</div>
            <div class="stat-label">{{ 'dashboard.totalCategories' | translate }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card low-stock" [class.warn]="stats()!.lowStockProductCount > 0">
          <mat-card-content>
            <mat-icon class="stat-icon">warning</mat-icon>
            <div class="stat-value">{{ stats()!.lowStockProductCount }}</div>
            <div class="stat-label">{{ 'dashboard.lowStock' | translate }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dashboard-grid">
        <mat-card class="section-card mat-elevation-z2">
          <mat-card-header>
            <mat-card-title>{{ 'dashboard.ordersByStatus' | translate }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (stats()!.ordersByStatus.length === 0) {
              <p class="empty">{{ 'dashboard.noOrders' | translate }}</p>
            } @else {
              <ul class="status-list">
                @for (s of stats()!.ordersByStatus; track s.status) {
                  <li>
                    <span class="status-name">{{ s.status | orderStatus }}</span>
                    <span class="status-count">{{ s.count }}</span>
                  </li>
                }
              </ul>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="section-card mat-elevation-z2">
          <mat-card-header>
            <mat-card-title>{{ 'dashboard.recentOrders' | translate }}</mat-card-title>
            <a mat-button routerLink="/orders" class="view-all">{{ 'dashboard.viewAll' | translate }}</a>
          </mat-card-header>
          <mat-card-content>
            @if (stats()!.recentOrders.length === 0) {
              <p class="empty">{{ 'dashboard.noOrders' | translate }}</p>
            } @else {
              <table mat-table [dataSource]="stats()!.recentOrders!" class="recent-table">
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
                <tr mat-header-row *matHeaderRowDef="recentColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: recentColumns"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      text-align: center;
      padding: 16px;
    }
    .stat-card .stat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #666;
      margin-bottom: 8px;
    }
    .stat-card.orders .stat-icon { color: #1976d2; }
    .stat-card.revenue .stat-icon { color: #2e7d32; }
    .stat-card.products .stat-icon { color: #ed6c02; }
    .stat-card.categories .stat-icon { color: #7b1fa2; }
    .stat-card.low-stock .stat-icon { color: #9e9e9e; }
    .stat-card.low-stock.warn .stat-icon { color: #d32f2f; }
    .stat-value { font-size: 1.5rem; font-weight: 600; margin: 4px 0; }
    .stat-label { font-size: 0.85rem; color: #666; }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
    .section-card mat-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
    .section-card .view-all { margin-left: auto; }
    .status-list { list-style: none; padding: 0; margin: 0; }
    .status-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .status-list li:last-child { border-bottom: none; }
    .status-name { font-weight: 500; }
    .status-count { color: #666; }
    .recent-table { width: 100%; }
    .recent-table a { color: inherit; text-decoration: none; }
    .recent-table a:hover { text-decoration: underline; }
    .empty { margin: 16px 0; color: #666; }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<DashboardStatsDto | null>(null);

  recentColumns = ['id', 'createdAt', 'status', 'totalAmount'];

  ngOnInit(): void {
    this.api.getDashboardStats().subscribe({
      next: data => this.stats.set(data),
      error: () => this.stats.set(null),
    });
  }
}
