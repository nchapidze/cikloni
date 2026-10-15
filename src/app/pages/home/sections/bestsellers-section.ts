import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductService } from '../../../core/products/product.service';
import { ProductCard } from '../../../shared/product-card/product-card';

/** design/HOME.md section 5. */
@Component({
  selector: 'app-bestsellers-section',
  imports: [RouterLink, TranslatePipe, ProductCard],
  template: `
    <section
      id="shop"
      class="mx-auto flex max-w-page scroll-mt-4 flex-col gap-8 px-6 py-20"
      aria-labelledby="bestsellers-title"
    >
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 id="bestsellers-title" class="m-0">{{ 'PRODUCTS.TITLE' | translate }}</h2>
        <!-- TODO: point to the catalog page once it exists. -->
        <a routerLink="/" fragment="shop" class="inline-flex min-h-11 items-center font-bold">{{
          'PRODUCTS.VIEW_ALL' | translate
        }}</a>
      </div>
      <ul class="m-0 flex list-none flex-wrap gap-6 p-0">
        @for (product of products(); track product.slug) {
          <li class="grow basis-60">
            <app-product-card [product]="product" />
          </li>
        }
      </ul>
    </section>
  `,
})
export class BestsellersSection {
  protected readonly products = inject(ProductService).products;
}
