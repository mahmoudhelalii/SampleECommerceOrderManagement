import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  dismissible?: boolean;
  autoDismissMs?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _notifications = new Map<string, Notification>();
  readonly notifications$ = new BehaviorSubject<Notification[]>([]);
  private static _id = 0;
  private static nextId(): string { return `n-${++NotificationService._id}-${Date.now()}`; }

  show(type: NotificationType, message: string, options: { dismissible?: boolean; autoDismissMs?: number } = {}): string {
    const id = NotificationService.nextId();
    const n: Notification = {
      id,
      type,
      message,
      dismissible: options.dismissible ?? true,
      autoDismissMs: options.autoDismissMs ?? (type === 'error' ? 0 : 5000)
    };
    this._notifications.set(id, n);
    this.emitList();
    if (n.autoDismissMs && n.autoDismissMs > 0)
      setTimeout(() => this.dismiss(id), n.autoDismissMs);
    return id;
  }

  success(message: string, options?: { dismissible?: boolean; autoDismissMs?: number }) {
    return this.show('success', message, options ?? {});
  }
  error(message: string, options?: { dismissible?: boolean; autoDismissMs?: number }) {
    return this.show('error', message, options ?? {});
  }
  warning(message: string, options?: { dismissible?: boolean; autoDismissMs?: number }) {
    return this.show('warning', message, options ?? {});
  }
  info(message: string, options?: { dismissible?: boolean; autoDismissMs?: number }) {
    return this.show('info', message, options ?? {});
  }

  dismiss(id: string): void {
    this._notifications.delete(id);
    this.emitList();
  }

  private emitList(): void {
    this.notifications$.next([...this._notifications.values()]);
  }
}
