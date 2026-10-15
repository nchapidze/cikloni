import { Injectable, computed, signal } from '@angular/core';
import { ColorId, Size } from '../products/product.model';

export interface CartItem {
  /** Line id: one line per product + color + size combination. */
  id: string;
  slug: string;
  colorId: ColorId;
  size: Size;
  quantity: number;
}

export type CartItemOptions = Pick<CartItem, 'slug' | 'colorId' | 'size'>;

function lineId({ slug, colorId, size }: CartItemOptions): string {
  return `${slug}:${colorId}:${size}`;
}

/** In-memory cart (not persisted yet). */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<readonly CartItem[]>([]);

  readonly items = this._items.asReadonly();
  readonly totalCount = computed(() => this._items().reduce((sum, item) => sum + item.quantity, 0));

  /** Adds `quantity` of a product variant, merging with an existing line. */
  addItem(options: CartItemOptions, quantity = 1): void {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    const id = lineId(options);
    this._items.update((items) =>
      items.some((item) => item.id === id)
        ? items.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + quantity } : item,
          )
        : [...items, { ...options, id, quantity }],
    );
  }

  removeItem(id: string): void {
    this._items.update((items) => items.filter((item) => item.id !== id));
  }

  /** Sets a line's quantity; zero or less removes the line. */
  updateQuantity(id: string, quantity: number): void {
    if (!Number.isInteger(quantity)) return;
    if (quantity < 1) {
      this.removeItem(id);
      return;
    }
    this._items.update((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }
}
