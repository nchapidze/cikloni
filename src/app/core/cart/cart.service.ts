import { DOCUMENT, DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ColorId, Product, Size, hasVariant, isSize } from '../products/product.model';
import { ProductService } from '../products/product.service';

export interface CartItem {
  /** Line id: one line per product + color + size combination. */
  id: string;
  slug: string;
  colorId: ColorId;
  size: Size;
  quantity: number;
}

export type CartItemOptions = Pick<CartItem, 'slug' | 'colorId' | 'size'>;

/** Per-line limit, matching the quantity stepper (design/PRODUCT.md: 1-10). */
export const MAX_LINE_QUANTITY = 10;

export const CART_STORAGE_KEY = 'cikloni.cart';

function lineId({ slug, colorId, size }: CartItemOptions): string {
  return `${slug}:${colorId}:${size}`;
}

function isSold(item: CartItem, products: readonly Product[]): boolean {
  const product = products.find((p) => p.slug === item.slug);
  return !!product && hasVariant(product, item.colorId, item.size);
}

/**
 * Cart state, persisted in localStorage and kept in sync across tabs.
 * Display only: prices and stock are recalculated server-side when an order is created.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly products = inject(ProductService);
  private readonly stored = signal<readonly CartItem[]>(this.readStored());

  /** Stored lines, minus any the catalog no longer sells once it has loaded. */
  readonly items = computed(() => {
    const products = this.products.loaded();
    return products ? this.stored().filter((item) => isSold(item, products)) : this.stored();
  });
  readonly totalCount = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));

  constructor() {
    const window = inject(DOCUMENT).defaultView;
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) this.stored.set(this.readStored());
    };
    window?.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => window?.removeEventListener('storage', onStorage));
  }

  /** Adds `quantity` of a product variant, merging with an existing line (capped per line). */
  addItem(options: CartItemOptions, quantity = 1): void {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    const id = lineId(options);
    this.commit((items) =>
      items.some((item) => item.id === id)
        ? items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(MAX_LINE_QUANTITY, item.quantity + quantity) }
              : item,
          )
        : [...items, { ...options, id, quantity: Math.min(MAX_LINE_QUANTITY, quantity) }],
    );
  }

  removeItem(id: string): void {
    this.commit((items) => items.filter((item) => item.id !== id));
  }

  /** Empties the cart, e.g. after an order is placed. */
  clear(): void {
    this.commit(() => []);
  }

  /** Sets a line's quantity; zero or less removes the line. */
  updateQuantity(id: string, quantity: number): void {
    if (!Number.isInteger(quantity)) return;
    if (quantity < 1) {
      this.removeItem(id);
      return;
    }
    const capped = Math.min(MAX_LINE_QUANTITY, quantity);
    this.commit((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: capped } : item)),
    );
  }

  /** Applies `update` to the visible lines, so saving also drops lines no longer sold. */
  private commit(update: (items: readonly CartItem[]) => readonly CartItem[]): void {
    this.stored.set(update(this.items()));
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.stored()));
    } catch {
      // Storage unavailable (private mode etc.); the cart just won't persist.
    }
  }

  /**
   * Restores saved lines, dropping malformed ones. The catalog loads asynchronously, so lines
   * no longer sold are filtered out later, in `items`.
   */
  private readStored(): CartItem[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];

    const lines = new Map<string, CartItem>();
    for (const raw of parsed as Partial<CartItem>[]) {
      if (
        typeof raw?.slug !== 'string' ||
        typeof raw.colorId !== 'string' ||
        !isSize(raw.size) ||
        !Number.isInteger(raw.quantity) ||
        raw.quantity! < 1
      ) {
        continue;
      }
      const options = { slug: raw.slug, colorId: raw.colorId, size: raw.size };
      const id = lineId(options);
      const quantity = Math.min(MAX_LINE_QUANTITY, (lines.get(id)?.quantity ?? 0) + raw.quantity!);
      lines.set(id, { ...options, id, quantity });
    }
    return [...lines.values()];
  }
}
