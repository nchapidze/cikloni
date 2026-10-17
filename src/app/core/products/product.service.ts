import { Injectable, computed, inject, resource } from '@angular/core';
import { ProductsApi } from '../data-access/products.api';
import { Product } from './product.model';

export type CatalogStatus = 'loading' | 'error' | 'ready';

/** Product catalog, loaded once per session from the API. */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ProductsApi);

  private readonly catalog = resource({
    loader: ({ abortSignal }) => this.api.listProducts(abortSignal),
  });

  /** The loaded products, or undefined while loading or after a failed load. */
  readonly loaded = computed(() => (this.catalog.hasValue() ? this.catalog.value() : undefined));

  readonly products = computed<readonly Product[]>(() => this.loaded() ?? []);

  /** A reload after a successful load keeps showing the products ("ready"). */
  readonly status = computed<CatalogStatus>(() => {
    if (this.catalog.hasValue()) return 'ready';
    if (this.catalog.isLoading()) return 'loading';
    return this.catalog.error() ? 'error' : 'loading';
  });

  reload(): void {
    this.catalog.reload();
  }

  getBySlug(slug: string): Product | undefined {
    return this.products().find((product) => product.slug === slug);
  }
}
