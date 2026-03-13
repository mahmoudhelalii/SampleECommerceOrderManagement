import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [AsyncPipe, MatIconModule, MatButtonModule],
  template: `
    <div class="toast-container">
      @for (n of notifications.notifications$ | async; track n.id) {
        <div class="toast mat-elevation-z6" [class]="'toast-' + n.type" role="alert">
          <mat-icon class="toast-icon">
            @switch (n.type) {
              @case ('success') { check_circle }
              @case ('error') { error }
              @case ('warning') { warning }
              @case ('info') { info }
            }
          </mat-icon>
          <span class="message">{{ n.message }}</span>
          @if (n.dismissible) {
            <button mat-icon-button type="button" (click)="notifications.dismiss(n.id)" aria-label="Close">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; top: 16px; right: 16px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; max-width: 420px; }
    .toast { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 8px; }
    .toast-icon { flex-shrink: 0; }
    .toast-success { background: #2e7d32; color: #fff; }
    .toast-success .mat-icon { color: #fff; }
    .toast-error { background: #c62828; color: #fff; }
    .toast-error .mat-icon { color: #fff; }
    .toast-warning { background: #ef6c00; color: #fff; }
    .toast-warning .mat-icon { color: #fff; }
    .toast-info { background: #0277bd; color: #fff; }
    .toast-info .mat-icon { color: #fff; }
    .message { flex: 1; font-size: 14px; }
  `],
})
export class NotificationToastComponent {
  notifications = inject(NotificationService);
}
