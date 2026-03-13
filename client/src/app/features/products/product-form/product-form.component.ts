import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService, CategoryDto, ProductOrderImpactDto } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    TranslateModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ (isEdit() ? 'products.editProduct' : 'products.newProduct') | translate }}</h1>
    </div>
    <mat-card class="form-card mat-elevation-z2">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'products.nameAr' | translate }}</mat-label>
            <input matInput formControlName="nameAr" type="text" [placeholder]="'products.nameAr' | translate" />
            <mat-error>{{ 'products.nameArRequired' | translate }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'products.nameEn' | translate }}</mat-label>
            <input matInput formControlName="nameEn" type="text" [placeholder]="'products.nameEn' | translate" />
            <mat-error>{{ 'products.nameEnRequired' | translate }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'products.descriptionAr' | translate }}</mat-label>
            <textarea matInput formControlName="descriptionAr" rows="3" [placeholder]="'products.descriptionAr' | translate"></textarea>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'products.descriptionEn' | translate }}</mat-label>
            <textarea matInput formControlName="descriptionEn" rows="3" [placeholder]="'products.descriptionEn' | translate"></textarea>
          </mat-form-field>
          <div class="file-upload full-width">
            <label class="file-upload-label">{{ 'products.productImage' | translate }}</label>
            <input #fileInput type="file" class="file-upload-input" (change)="onFileSelected($event)" accept=".jpg,.jpeg,.png,.gif,.webp" />
            <button type="button" mat-stroked-button (click)="fileInput.click()">
              {{ selectedFile() ? selectedFile()!.name : ('products.chooseImage' | translate) }}
            </button>
            <span class="file-upload-hint">{{ 'products.productImageHint' | translate }}</span>
          </div>
          @if (existingImageUrl() && !selectedFile()) {
            <div class="current-image">
              <img [src]="api.getImageUrl(existingImageUrl())!" alt="" />
              <span class="current-label">{{ 'products.currentImage' | translate }}</span>
            </div>
          }
          @if (isEdit() && orderImpact() && orderImpact()!.orderCount > 0 && form.get('price')?.value !== initialPrice()) {
            <p class="impact-warning">{{ 'products.priceChangeWarning' | translate:{ count: orderImpact()!.orderCount } }}</p>
          }
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'products.price' | translate }}</mat-label>
            <input matInput type="number" formControlName="price" step="0.01" />
            <mat-error>{{ 'products.validPriceRequired' | translate }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'products.stock' | translate }}</mat-label>
            <input matInput type="number" formControlName="stockQuantity" />
            <mat-hint *ngIf="isEdit() && orderImpact() && orderImpact()!.quantityInOrders > 0">{{ 'products.stockMinHint' | translate:{ min: orderImpact()!.quantityInOrders } }}</mat-hint>
            <mat-error>{{ 'products.validStockRequired' | translate }}</mat-error>
            <mat-error *ngIf="form.get('stockQuantity')?.errors?.['min']">{{ 'products.stockBelowOrders' | translate:{ min: orderImpact()?.quantityInOrders ?? 0 } }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ 'products.sku' | translate }}</mat-label>
            <input matInput formControlName="sku" type="text" [placeholder]="'products.sku' | translate" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'products.category' | translate }}</mat-label>
            <mat-select formControlName="categoryId">
              @for (c of categories; track c.id) {
                <mat-option [value]="c.id">{{ (c.nameAr || '—') }} / {{ (c.nameEn || '—') }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ 'products.categoryRequired' | translate }}</mat-error>
          </mat-form-field>
          <div class="actions">
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">{{ 'products.save' | translate }}</button>
            <a mat-button routerLink="/products">{{ 'products.cancel' | translate }}</a>
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
    .file-upload { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .file-upload-label { font-size: 12px; color: rgba(0,0,0,.6); }
    .file-upload-input { display: none; }
    .file-upload-hint { font-size: 12px; color: rgba(0,0,0,.6); }
    .impact-warning { color: #e65100; background: #fff3e0; padding: 12px; border-radius: 8px; margin: 8px 0; }
    .current-image { margin: 12px 0; }
    .current-image img { max-width: 200px; max-height: 150px; object-fit: contain; display: block; border-radius: 8px; border: 1px solid #ddd; }
    .current-label { font-size: 0.85rem; color: #666; display: block; margin-top: 4px; }
    .actions { display: flex; gap: 12px; margin-top: 16px; }
  `],
})
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public api = inject(ApiService);
  private notifications = inject(NotificationService);
  private translate = inject(TranslateService);

  form = this.fb.nonNullable.group({
    nameEn: ['', Validators.required],
    nameAr: ['', Validators.required],
    descriptionEn: [''],
    descriptionAr: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', Validators.required],
    sku: [''],
  });
  categories: CategoryDto[] = [];
  saving = signal(false);
  isEdit = signal(false);
  orderImpact = signal<ProductOrderImpactDto | null>(null);
  initialPrice = signal<number | null>(null);
  existingImageUrl = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  private editId: string | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedFile.set(file ?? null);
  }

  ngOnInit(): void {
    this.api.getCategories().subscribe(c => (this.categories = c));
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.editId = id;
      this.isEdit.set(true);
      forkJoin({
        product: this.api.getProduct(id),
        impact: this.api.getProductOrderImpact(id).pipe(
          catchError(() => of({ quantityInOrders: 0, orderCount: 0 })),
        ),
      }).subscribe({
        next: ({ product: p, impact }) => {
          const anyP = p as { nameEn?: string; nameAr?: string; name?: string };
          this.form.patchValue({
            nameEn: anyP.nameEn ?? anyP.name ?? '',
            nameAr: anyP.nameAr ?? '',
            descriptionEn: (p as { descriptionEn?: string }).descriptionEn ?? '',
            descriptionAr: (p as { descriptionAr?: string }).descriptionAr ?? '',
            price: p.price,
            stockQuantity: p.stockQuantity,
            categoryId: p.categoryId,
            sku: (p as { sku?: string }).sku ?? '',
          });
          this.initialPrice.set(p.price);
          this.existingImageUrl.set((p as { imageUrl?: string }).imageUrl ?? null);
          this.orderImpact.set(impact);
          const minStock = Math.max(0, impact.quantityInOrders);
          this.form.get('stockQuantity')?.setValidators([
            Validators.required,
            Validators.min(minStock),
          ]);
          this.form.get('stockQuantity')?.updateValueAndValidity();
        },
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    const file = this.selectedFile();
    const existingUrl = this.existingImageUrl();

    const doSave = (imageUrl: string | null) => {
      const body = {
        nameEn: v.nameEn,
        nameAr: v.nameAr,
        descriptionEn: v.descriptionEn || null,
        descriptionAr: v.descriptionAr || null,
        imageUrl,
        price: v.price,
        stockQuantity: v.stockQuantity,
        categoryId: v.categoryId,
        sku: v.sku || null,
      };
      const req = this.editId ? this.api.updateProduct(this.editId, body) : this.api.createProduct(body);
      req.subscribe({
        next: () => {
          this.notifications.success(this.translate.instant('notifications.productSaved'));
          this.router.navigate(['/products']);
        },
        error: () => this.saving.set(false),
      });
    };

    if (file) {
      this.api.uploadProductImage(file).subscribe({
        next: (res) => doSave(res.path),
        error: () => this.saving.set(false),
      });
    } else {
      doSave(existingUrl);
    }
  }
}
