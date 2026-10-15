import { Injectable, signal } from '@angular/core';
import { PRODUCT_COLORS, PRODUCTS } from './product.data';
import { ColorId, Product, ProductColor } from './product.model';

/** Product catalog. Backed by mock data for now; swap for HTTP when an API exists. */
@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly products = signal<readonly Product[]>(PRODUCTS).asReadonly();

  getBySlug(slug: string): Product | undefined {
    return this.products().find((product) => product.slug === slug);
  }

  getColor(id: ColorId): ProductColor {
    return PRODUCT_COLORS[id];
  }

  /** The product's color options, resolved to full color data. */
  getColors(product: Product): ProductColor[] {
    return product.colors.map((id) => PRODUCT_COLORS[id]);
  }
}
