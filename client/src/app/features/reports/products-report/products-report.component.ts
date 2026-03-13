import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as XLSX from 'xlsx';
import { ApiService, ProductDto } from '../../../core/services/api.service';

@Component({
  selector: 'app-products-report',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'report.productsTitle' | translate }}</h1>
      <div class="actions">
        <button mat-flat-button color="primary" (click)="exportExcel()" [disabled]="loading() || (products().length === 0)">
          <mat-icon>table_chart</mat-icon>
          {{ 'report.exportExcel' | translate }}
        </button>
      </div>
    </div>
    <mat-card class="report-card mat-elevation-z2">
      <mat-card-content>
        @if (loading()) {
          <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
        } @else if (products().length === 0) {
          <p class="empty">{{ 'report.noData' | translate }}</p>
        } @else {
          <table mat-table [dataSource]="products()" class="report-table">
            <ng-container matColumnDef="nameEn">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.nameEn' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.nameEn }}</td>
            </ng-container>
            <ng-container matColumnDef="nameAr">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.nameAr' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.nameAr }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.category' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ categoryName(row) }}</td>
            </ng-container>
            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.sku' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.sku ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.price' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.price | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="stockQuantity">
              <th mat-header-cell *matHeaderCellDef>{{ 'products.stock' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.stockQuantity }}</td>
            </ng-container>
            <ng-container matColumnDef="averageRating">
              <th mat-header-cell *matHeaderCellDef>{{ 'report.rating' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.averageRating ?? '—' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
          <p class="summary">{{ 'report.totalProducts' | translate }}: {{ products().length }}</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .actions button mat-icon { margin-inline-end: 8px; vertical-align: middle; font-size: 20px; width: 20px; height: 20px; }
    .report-card { overflow: hidden; }
    .report-table { width: 100%; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty { text-align: center; color: #666; padding: 48px; margin: 0; }
    .summary { margin-top: 16px; font-weight: 600; color: #333; }
  `],
})
export class ProductsReportComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly translate = inject(TranslateService);

  products = signal<ProductDto[]>([]);
  loading = signal(true);
  displayedColumns = ['nameEn', 'nameAr', 'category', 'sku', 'price', 'stockQuantity', 'averageRating'];

  ngOnInit(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.api.getProducts({ page: 1, pageSize: 10000 }).subscribe({
      next: res => {
        this.products.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  categoryName(row: ProductDto): string {
    const lang = this.translate.currentLang;
    if (lang === 'ar') return row.categoryNameAr ?? row.categoryNameEn ?? '—';
    return row.categoryNameEn ?? row.categoryNameAr ?? '—';
  }

  exportExcel(): void {
    const rows = this.products().map(p => ({
      [this.translate.instant('products.nameEn')]: p.nameEn,
      [this.translate.instant('products.nameAr')]: p.nameAr,
      [this.translate.instant('products.category')]: this.categoryName(p),
      [this.translate.instant('products.sku')]: p.sku ?? '',
      [this.translate.instant('products.price')]: p.price,
      [this.translate.instant('products.stock')]: p.stockQuantity,
      [this.translate.instant('report.rating')]: p.averageRating ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.translate.instant('report.productsSheet'));
    XLSX.writeFile(wb, `products-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}
