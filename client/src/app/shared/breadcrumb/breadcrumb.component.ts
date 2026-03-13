import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { filter } from 'rxjs/operators';

export interface BreadcrumbItem {
  label: string;
  url: string | null;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, MatIconModule],
  template: `
    @if (items().length > 0) {
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          @for (item of items(); track item.url ?? item.label; let last = $last) {
            <li class="breadcrumb-item">
              @if (!last && item.url) {
                <a [routerLink]="item.url" class="breadcrumb-link">{{ item.label }}</a>
              } @else {
                <span class="breadcrumb-current" [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
              }
              @if (!last) {
                <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: [`
    .breadcrumb { padding: 12px 0; margin: 0; border-bottom: 1px solid #eee; background: #fafafa; }
    .breadcrumb-list { list-style: none; margin: 0; padding: 0 24px; display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 0.9rem; }
    .breadcrumb-item { display: inline-flex; align-items: center; gap: 4px; }
    .breadcrumb-link { color: #006a6a; text-decoration: none; }
    .breadcrumb-link:hover { text-decoration: underline; }
    .breadcrumb-current { color: #555; font-weight: 500; }
    .breadcrumb-sep { font-size: 18px; width: 18px; height: 18px; color: #999; }
  `],
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly breadcrumb = inject(BreadcrumbService);
  private routerSub: ReturnType<typeof this.router.events.subscribe> | null = null;
  private langSub: ReturnType<TranslateService['onLangChange']['subscribe']> | null = null;

  items = signal<BreadcrumbItem[]>([]);

  ngOnInit(): void {
    this.buildItems();
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.buildItems());
    this.langSub = this.translate.onLangChange.subscribe(() => setTimeout(() => this.buildItems(), 0));
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.langSub?.unsubscribe();
  }

  private buildItems(): void {
    const url = this.router.url.split('?')[0];
    const segments = url.replace(/^\/+/, '').split('/').filter(Boolean);
    const customLabel = this.breadcrumb.currentLabel();
    const result: BreadcrumbItem[] = [];
    let path = '';

    if (segments.length === 0) {
      result.push({ label: this.translate.instant('breadcrumb.home'), url: '/' });
      this.items.set(result);
      return;
    }

    const segmentLabels: Record<string, string> = {
      dashboard: 'nav.dashboard',
      products: 'nav.products',
      cart: 'nav.cart',
      checkout: 'breadcrumb.checkout',
      orders: 'nav.orders',
      order: 'nav.orders',
      admin: 'breadcrumb.admin',
      categories: 'nav.categories',
      new: 'breadcrumb.new',
      edit: 'breadcrumb.edit',
    };

    result.push({ label: this.translate.instant('breadcrumb.home'), url: '/' });
    path = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      path += (path ? '/' : '') + seg;
      const fullPath = '/' + path;
      const isLast = i === segments.length - 1;
      const isId = /^[0-9a-f-]{36}$/i.test(seg) || /^[0-9a-f]{8}-/i.test(seg);
      const isAdminSegment = seg === 'admin' && i === 1;
      const adminPath = isAdminSegment ? '/dashboard' : fullPath;

      let label: string;
      if (isLast && customLabel) {
        label = customLabel;
      } else if (seg === 'admin') {
        label = this.translate.instant(segmentLabels['admin'] || seg);
      } else if (seg === 'products' && segments[i - 1] === 'admin') {
        label = this.translate.instant('nav.products');
      } else if (seg === 'categories' && segments[i - 1] === 'admin') {
        label = this.translate.instant('nav.categories');
      } else if (seg === 'users' && segments[i - 1] === 'admin') {
        label = this.translate.instant('nav.users');
      } else if (seg === 'reports') {
        label = this.translate.instant('report.reports');
      } else if (seg === 'products' && segments[i - 1] === 'reports') {
        label = this.translate.instant('report.productsTitle');
      } else if (seg === 'new') {
        label = segments[i - 1] === 'products'
          ? this.translate.instant('products.newProduct')
          : this.translate.instant('categories.newCategory');
      } else if (seg === 'edit') {
        label = segments[i - 2] === 'products'
          ? this.translate.instant('products.editProduct')
          : this.translate.instant('categories.editCategory');
      } else if (isId && segments[i - 1] === 'products') {
        label = customLabel && isLast ? customLabel : this.translate.instant('breadcrumb.productDetail');
      } else if (isId && segments[i - 1] === 'order') {
        label = customLabel && isLast ? customLabel : this.translate.instant('breadcrumb.orderDetail');
      } else if (isId && (segments[i - 1] === 'categories' || segments[i - 2] === 'categories')) {
        label = customLabel && isLast ? customLabel : this.translate.instant('breadcrumb.edit');
      } else {
        const key = segmentLabels[seg];
        label = key ? this.translate.instant(key) : seg;
      }

      result.push({
        label,
        url: isLast ? null : (isAdminSegment ? adminPath : fullPath),
      });
    }

    this.items.set(result);
  }
}
