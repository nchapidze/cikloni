import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CARD_TINTS } from '@cikloni/shared';
import { ProductService } from '../../../core/products/product.service';
import { LoadError } from '../../../shared/load-error/load-error';
import { ProductCard } from '../../../shared/product-card/product-card';

/** design/HOME.md section 5. */
@Component({
  selector: 'app-bestsellers-section',
  imports: [RouterLink, TranslatePipe, LoadError, ProductCard],
  template: `
    <section
      id="shop"
      class="mx-auto flex max-w-page scroll-mt-4 flex-col gap-8 px-6 py-20"
      aria-labelledby="bestsellers-title"
      [attr.aria-busy]="status() === 'loading'"
    >
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 id="bestsellers-title" class="m-0">{{ 'PRODUCTS.TITLE' | translate }}</h2>
        <!-- TODO: point to the catalog page once it exists. -->
        <a routerLink="/" fragment="shop" class="inline-flex min-h-11 items-center font-bold">{{
          'PRODUCTS.VIEW_ALL' | translate
        }}</a>
      </div>

      @switch (status()) {
        @case ('loading') {
          <p class="sr-only" role="status">{{ 'CATALOG.LOADING' | translate }}</p>
          <ul class="m-0 flex list-none flex-wrap gap-6 p-0" aria-hidden="true">
            @for (tint of tints; track $index) {
              <li class="flex grow basis-60 flex-col gap-3" data-testid="product-skeleton">
                <div class="h-80 rounded-card bg-blush motion-safe:animate-pulse"></div>
                <div class="h-5 w-2/3 rounded-pill bg-blush motion-safe:animate-pulse"></div>
                <div class="h-5 w-1/3 rounded-pill bg-blush motion-safe:animate-pulse"></div>
              </li>
            }
          </ul>
        }
        @case ('error') {
          <app-load-error (retry)="productService.reload()" />
        }
        @default {
          @if (products().length) {
            <ul class="m-0 flex list-none flex-wrap gap-6 p-0">
              @for (product of products(); track product.id) {
                <li class="grow basis-60">
                  <app-product-card [product]="product" [tint]="tints[$index % tints.length]" />
                </li>
              }
            </ul>
          } @else {
            <p class="m-0">{{ 'CATALOG.EMPTY' | translate }}</p>
          }
        }
      }
    </section>
  `,
})
export class BestsellersSection {
  protected readonly productService = inject(ProductService);

  protected readonly status = this.productService.status;
  protected readonly products = computed(() =>
    this.productService.products().filter((product) => product.bestseller),
  );
  protected readonly tints = CARD_TINTS;
}
