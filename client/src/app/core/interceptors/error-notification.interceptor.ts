import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

export const errorNotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401)
        notifications.error('Session expired or invalid. Please log in again.');
      else if (err.status === 403)
        notifications.error('You do not have permission to perform this action.');
      else if (err.error?.errors?.length)
        err.error.errors.forEach((e: string) => notifications.error(e));
      else
        notifications.error(err.error?.error ?? err.message ?? 'An error occurred.');
      return throwError(() => err);
    })
  );
};
