import { Injectable, signal, computed } from '@angular/core';
import { ProductDto } from './api.service';

export interface CartItem { product: ProductDto; quantity: number; }

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = signal<CartItem[]>([]);
  items = this._items.asReadonly();
  totalItems = computed(() => this._items().reduce((s, i) => s + i.quantity, 0));
  totalAmount = computed(() => this._items().reduce((s, i) => s + i.product.price * i.quantity, 0));

  add(product: ProductDto, quantity: number = 1): void {
    const list = [...this._items()];
    const idx = list.findIndex(x => x.product.id === product.id);
    if (idx >= 0) list[idx] = { ...list[idx], quantity: list[idx].quantity + quantity };
    else list.push({ product, quantity });
    this._items.set(list);
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) { this.remove(productId); return; }
    const list = this._items().map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    this._items.set(list);
  }

  remove(productId: string): void {
    this._items.set(this._items().filter(i => i.product.id !== productId));
  }

  clear(): void {
    this._items.set([]);
  }
}
