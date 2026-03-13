import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';

export interface AddUserDialogResult {
  email: string;
  password: string;
  fullName: string;
  role: string;
}

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'users.addUser' | translate }}</h2>
    <form [formGroup]="form" (ngSubmit)="submit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'auth.fullName' | translate }}</mat-label>
          <input matInput formControlName="fullName" />
          <mat-error>{{ 'auth.fullNameRequired' | translate }}</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'auth.email' | translate }}</mat-label>
          <input matInput type="email" formControlName="email" />
          <mat-error>{{ 'auth.validEmailRequired' | translate }}</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'auth.password' | translate }}</mat-label>
          <input matInput type="password" formControlName="password" />
          <mat-error>{{ 'auth.passwordRequired' | translate }}</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'users.role' | translate }}</mat-label>
          <mat-select formControlName="role">
            <mat-option value="Customer">{{ 'users.roleCustomer' | translate }}</mat-option>
            <mat-option value="Admin">{{ 'users.roleAdmin' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button type="button" mat-button mat-dialog-close>{{ 'products.cancel' | translate }}</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid">{{ 'users.addUser' | translate }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width { width: 100%; display: block; min-width: 280px; }
    mat-dialog-content { display: flex; flex-direction: column; gap: 0; padding-top: 8px; }
    mat-dialog-actions { padding: 16px 0 0; }
  `],
})
export class AddUserDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<AddUserDialogComponent>);

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    role: ['Customer' as string, Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue() as AddUserDialogResult);
  }
}
