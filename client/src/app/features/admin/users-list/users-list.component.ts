import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService, UserListItemDto, PagedResult } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AddUserDialogComponent } from '../add-user-dialog/add-user-dialog.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ 'users.title' | translate }}</h1>
      <button mat-flat-button color="primary" (click)="openAddUser()">
        {{ 'users.addUser' | translate }}
      </button>
    </div>
    <mat-card class="list-card mat-elevation-z2">
      <mat-card-content>
        @if (result() === null) {
          <div class="loading"><mat-spinner diameter="32"></mat-spinner></div>
        } @else if (result()!.items.length === 0) {
          <p class="empty">{{ 'users.empty' | translate }}</p>
        } @else {
          <table mat-table [dataSource]="result()!.items" class="users-table">
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>{{ 'users.email' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef>{{ 'users.fullName' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>{{ 'users.role' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.role === 'Admin' ? ('users.roleAdmin' | translate) : ('users.roleCustomer' | translate) }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>{{ 'users.createdAt' | translate }}</th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'short' }}</td>
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
    .page-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .list-card { overflow: hidden; }
    .users-table { width: 100%; }
    .empty { margin: 24px 0; color: #666; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .pagination { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
    .page-info { font-size: 0.95rem; }
  `],
})
export class UsersListComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  result = signal<PagedResult<UserListItemDto> | null>(null);
  page = signal(1);
  pageSize = 20;
  totalPages = computed(() => {
    const r = this.result();
    if (!r) return 1;
    return Math.max(1, Math.ceil(r.totalCount / r.pageSize));
  });
  displayedColumns = ['email', 'fullName', 'role', 'createdAt'];

  ngOnInit(): void {
    this.load(1);
  }

  openAddUser(): void {
    const ref = this.dialog.open(AddUserDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe((data) => {
      if (!data) return;
      this.api.createUser(data).subscribe({
        next: () => {
          this.notifications.success(this.translate.instant('users.userCreated'));
          this.load(this.page());
        },
        error: (err) => {
          const msg = err.error?.errors?.[0] || this.translate.instant('notifications.errorOccurred');
          this.notifications.warning(msg);
        },
      });
    });
  }

  load(p: number): void {
    this.page.set(p);
    this.api.getUsers({ page: p, pageSize: this.pageSize }).subscribe({
      next: data => this.result.set(data),
      error: () => this.result.set({ items: [], totalCount: 0, page: p, pageSize: this.pageSize }),
    });
  }
}
