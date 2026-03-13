import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService, CategoryDto } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'categories.title' | translate }}</h1>
      <a mat-flat-button color="primary" routerLink="/admin/categories/new">
        <mat-icon>add</mat-icon>
        {{ 'categories.addCategory' | translate }}
      </a>
    </div>
    <mat-card class="list-card mat-elevation-z2">
      <mat-card-content>
        @if (categories().length === 0 && !loading()) {
          <p class="empty">{{ 'categories.empty' | translate }}</p>
        } @else if (loading()) {
          <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
        } @else {
          <table mat-table [dataSource]="categories()" class="category-table">
            <ng-container matColumnDef="nameAr">
              <th mat-header-cell *matHeaderCellDef>{{ 'categories.nameAr' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.nameAr || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="nameEn">
              <th mat-header-cell *matHeaderCellDef>{{ 'categories.nameEn' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.nameEn || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>{{ 'categories.description' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.description || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <a mat-icon-button [routerLink]="['/admin/categories', row.id, 'edit']" [attr.aria-label]="'categories.edit' | translate">
                  <mat-icon>edit</mat-icon>
                </a>
                <button mat-icon-button color="warn" (click)="confirmDelete(row)" [attr.aria-label]="'categories.delete' | translate">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .list-card { overflow: hidden; }
    .category-table { width: 100%; }
    .empty { margin: 24px 0; color: #666; }
    .loading { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class CategoryListComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  categories = signal<CategoryDto[]>([]);
  loading = signal(true);
  displayedColumns = ['nameAr', 'nameEn', 'description', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getCategories().subscribe({
      next: list => {
        this.categories.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  confirmDelete(row: CategoryDto): void {
    if (!confirm(this.translate.instant('categories.confirmDelete'))) return;
    this.api.deleteCategory(row.id).subscribe({
      next: () => {
        this.notifications.success(this.translate.instant('notifications.categoryDeleted'));
        this.load();
      },
    });
  }
}
