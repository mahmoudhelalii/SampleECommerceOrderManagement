import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ (isEdit() ? 'categories.editCategory' : 'categories.newCategory') | translate }}</h1>
    </div>
    <mat-card class="form-card mat-elevation-z2">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'categories.nameAr' | translate }}</mat-label>
            <input matInput formControlName="nameAr" type="text" [placeholder]="'categories.nameAr' | translate" />
            <mat-error>{{ 'categories.nameArRequired' | translate }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'categories.nameEn' | translate }}</mat-label>
            <input matInput formControlName="nameEn" type="text" [placeholder]="'categories.nameEn' | translate" />
            <mat-error>{{ 'categories.nameEnRequired' | translate }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'categories.description' | translate }}</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
          </mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">{{ 'products.save' | translate }}</button>
            <a mat-button routerLink="/admin/categories">{{ 'products.cancel' | translate }}</a>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0; font-size: 1.75rem; }
    .form-card { max-width: 480px; }
    .full-width { width: 100%; display: block; margin-bottom: 8px; }
    .actions { display: flex; gap: 12px; margin-top: 16px; }
  `],
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  form = this.fb.nonNullable.group({
    nameAr: ['', Validators.required],
    nameEn: ['', Validators.required],
    description: [''],
  });
  saving = signal(false);
  isEdit = signal(false);
  private editId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editId = id;
      this.isEdit.set(true);
      this.api.getCategory(id).subscribe({
        next: c => this.form.patchValue({
          nameEn: c.nameEn ?? (c as { name?: string }).name ?? '',
          nameAr: c.nameAr ?? '',
          description: c.description ?? '',
        }),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    const v = this.form.getRawValue();
    const body = { nameEn: v.nameEn, nameAr: v.nameAr, description: v.description || null };
    this.saving.set(true);
    const req = this.editId
      ? this.api.updateCategory(this.editId, body)
      : this.api.createCategory(body);
    req.subscribe({
      next: () => {
        this.notifications.success(this.translate.instant('notifications.categorySaved'));
        this.router.navigate(['/admin/categories']);
      },
      error: () => this.saving.set(false),
    });
  }
}
