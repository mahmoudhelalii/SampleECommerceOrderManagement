import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
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
  selector: 'app-login',
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
    <div class="login-page">
      <button type="button" class="lang-toggle" (click)="locale.toggleLanguage()" [attr.aria-label]="'auth.changeLanguage' | translate">
        <mat-icon>language</mat-icon>
        <span>{{ locale.currentLang === 'ar' ? 'English' : 'العربية' }}</span>
      </button>
      <div class="login-brand">
        <img src="/logo.png" alt="{{ 'app.title' | translate }}" class="login-logo" onerror="this.style.display='none'" />
        <h2 class="login-app-title">{{ 'app.title' | translate }}</h2>
      </div>
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>{{ 'auth.signIn' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
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
            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="form.invalid || loading">
              @if (loading) {
                <mat-spinner diameter="24"></mat-spinner>
              } @else {
                {{ 'auth.login' | translate }}
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/register">{{ 'auth.register' | translate }}</a>
          <a mat-button routerLink="/products">{{ 'auth.continueAsGuest' | translate }}</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page { min-height: 85vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; gap: 24px; position: relative; }
    .lang-toggle { position: absolute; top: 16px; inset-inline-end: 16px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border: 1px solid #ccc; border-radius: 8px; background: #fff; cursor: pointer; font-size: 0.95rem; color: #555; }
    .lang-toggle:hover { background: #f5f5f5; color: #333; }
    .lang-toggle mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .login-brand { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
    .login-logo { max-width: 320px; max-height: 160px; width: auto; height: auto; object-fit: contain; display: block; }
    .login-app-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #333; }
    .login-card { width: 100%; max-width: 400px; }
    .full-width { width: 100%; display: block; }
    .submit-btn { margin-top: 8px; height: 48px; }
    .submit-btn mat-spinner { margin: 0 auto; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);
  locale = inject(LocaleService);
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;

  onSubmit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.notifications.success(this.translate.instant('notifications.loggedIn'));
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: () => { this.loading = false; },
    });
  }
}
