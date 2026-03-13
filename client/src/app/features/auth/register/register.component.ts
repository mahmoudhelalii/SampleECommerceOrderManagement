import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LocaleService } from '../../../core/services/locale.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    TranslateModule,
  ],
  template: `
    <div class="register-page">
      <button type="button" class="lang-toggle" (click)="locale.toggleLanguage()" [attr.aria-label]="'auth.changeLanguage' | translate">
        <mat-icon>language</mat-icon>
        <span>{{ locale.currentLang === 'ar' ? 'English' : 'العربية' }}</span>
      </button>
      <div class="register-brand">
        <img src="/logo.png" alt="{{ 'app.title' | translate }}" class="register-logo" onerror="this.style.display='none'" />
        <h2 class="register-app-title">{{ 'app.title' | translate }}</h2>
      </div>
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>{{ 'auth.register' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'auth.fullName' | translate }}</mat-label>
              <input matInput type="text" formControlName="fullName" [placeholder]="'auth.fullName' | translate" />
              <mat-error>{{ 'auth.fullNameRequired' | translate }}</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'auth.email' | translate }}</mat-label>
              <input matInput type="email" formControlName="email" [placeholder]="'auth.email' | translate" />
              <mat-error>{{ 'auth.validEmailRequired' | translate }}</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'auth.password' | translate }}</mat-label>
              <input matInput type="password" formControlName="password" [placeholder]="'auth.password' | translate" />
              <mat-error>{{ 'auth.passwordRequired' | translate }}</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'auth.confirmPassword' | translate }}</mat-label>
              <input matInput type="password" formControlName="confirmPassword" [placeholder]="'auth.confirmPassword' | translate" />
              @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                <mat-error>{{ 'auth.passwordMismatch' | translate }}</mat-error>
              }
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="form.invalid || loading">
              @if (loading) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                {{ 'auth.register' | translate }}
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/login">{{ 'auth.alreadyHaveAccount' | translate }}</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-page { min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; gap: 24px; position: relative; }
    .lang-toggle { position: absolute; top: 16px; inset-inline-end: 16px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid #ccc; border-radius: 8px; background: #fff; cursor: pointer; font-size: 0.95rem; color: #555; }
    .lang-toggle:hover { background: #f5f5f5; color: #333; }
    .lang-toggle mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .register-brand { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .register-logo { max-width: 320px; max-height: 160px; width: auto; height: auto; object-fit: contain; display: block; }
    .register-app-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #333; }
    .register-card { width: 100%; max-width: 400px; }
    .full-width { width: 100%; display: block; }
    .submit-btn { margin-top: 8px; height: 48px; }
    .submit-btn mat-spinner { margin: 0 auto; }
  `],
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);
  locale = inject(LocaleService);

  form = this.fb.nonNullable.group(
    {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: (g) => (g.get('password')?.value === g.get('confirmPassword')?.value ? null : { mismatch: true }) }
  );
  loading = false;

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const { fullName, email, password } = this.form.getRawValue();
    this.auth.register({ fullName, email, password }).subscribe({
      next: () => {
        this.notifications.success(this.translate.instant('notifications.registered'));
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.errors?.[0] || err.message || this.translate.instant('notifications.errorOccurred');
        this.notifications.warning(msg);
      },
    });
  }
}
