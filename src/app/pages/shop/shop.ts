import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { createGlobalPositionStrategy } from '@angular/cdk/overlay';
import { Component, DestroyRef, Injector, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CARD_TINTS } from '@cikloni/shared';
import { LucideAngularModule, SlidersHorizontal } from 'lucide-angular';
import {
  CATALOG_SORTS,
  CatalogQuery,
  CatalogSort,
  activeFilterCount,
  applyCatalogQuery,
  catalogOptions,
  clearFilters,
  isOutOfStock,
  parseCatalogQuery,
  toQueryParams,
} from '../../core/catalog/catalog-query';
import { ProductService } from '../../core/products/product.service';
import { LoadError } from '../../shared/load-error/load-error';
import { ProductCard } from '../../shared/product-card/product-card';
import { CatalogFilters } from './catalog-filters';
import { FILTER_SHEET_TITLE_ID, FilterSheet, FilterSheetData } from './filter-sheet';

const SORT_KEYS: Record<CatalogSort, string> = {
  featured: 'CATALOG.SORT.FEATURED',
  'price-asc': 'CATALOG.SORT.PRICE_ASC',
  'price-desc': 'CATALOG.SORT.PRICE_DESC',
  newest: 'CATALOG.SORT.NEWEST',
};

const SKELETONS = 8;

/**
 * /shop: every product with filters and sorting. The state lives in the URL query
 * (?absorbency=light&style=bikini&size=M&color=coral&sort=price-asc), so a view can be shared.
 * Filters are a sidebar from the lg breakpoint, and a bottom sheet below it.
 */
@Component({
  selector: 'app-shop-page',
  imports: [TranslatePipe, LucideAngularModule, LoadError, ProductCard, CatalogFilters],
  template: `
    <div class="mx-auto flex max-w-page flex-col gap-8 px-6 pt-10 pb-20">
      <header class="flex flex-col gap-2">
        <h1 class="m-0 text-h2 md:text-h1">{{ 'CATALOG.TITLE' | translate }}</h1>
        <p class="m-0 max-w-2xl">{{ 'CATALOG.INTRO' | translate }}</p>
      </header>

      <div class="flex gap-10">
        <aside class="hidden w-60 shrink-0 flex-col gap-6 lg:flex" aria-labelledby="filters-title">
          <div class="flex items-center justify-between gap-3">
            <h2 id="filters-title" class="m-0 text-h3">
              {{ 'CATALOG.FILTERS.TITLE' | translate }}
            </h2>
            @if (activeCount()) {
              <button
                type="button"
                class="min-h-11 cursor-pointer border-0 bg-transparent px-0 font-semibold text-plum underline underline-offset-4"
                (click)="setQuery(clear(query()))"
              >
                {{ 'CATALOG.FILTERS.CLEAR' | translate }}
              </button>
            }
          </div>
          <app-catalog-filters
            [query]="query()"
            [options]="options()"
            (queryChange)="setQuery($event)"
          />
        </aside>

        <div class="flex min-w-0 flex-1 flex-col gap-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border-2 border-plum bg-background px-5 font-bold text-plum lg:hidden"
              aria-haspopup="dialog"
              (click)="openFilters()"
            >
              <lucide-icon [img]="filtersIcon" [size]="20" />
              @if (activeCount(); as count) {
                {{ 'CATALOG.FILTERS.OPEN_COUNT' | translate: { count } }}
              } @else {
                {{ 'CATALOG.FILTERS.OPEN' | translate }}
              }
            </button>

            <p class="m-0 font-semibold" role="status" data-testid="result-count">
              @if (status() === 'ready') {
                {{ resultsKey() | translate: { count: results().length } }}
              }
            </p>

            <label class="ml-auto flex items-center gap-2">
              <span class="font-semibold">{{ 'CATALOG.SORT.LABEL' | translate }}</span>
              <select
                class="min-h-11 cursor-pointer rounded-pill border-2 border-plum bg-background px-4 font-semibold text-plum"
                (change)="setSort($any($event.target).value)"
              >
                @for (sort of sorts; track sort) {
                  <option [value]="sort" [selected]="sort === query().sort">
                    {{ sortKeys[sort] | translate }}
                  </option>
                }
              </select>
            </label>
          </div>

          @switch (status()) {
            @case ('loading') {
              <p class="sr-only" role="status">{{ 'CATALOG.LOADING' | translate }}</p>
              <ul
                class="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4"
                aria-hidden="true"
              >
                @for (i of skeletons; track i) {
                  <li class="flex flex-col gap-3" data-testid="product-skeleton">
                    <div class="aspect-3/4 rounded-card bg-blush motion-safe:animate-pulse"></div>
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
              @if (results().length) {
                <ul
                  class="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-8 p-0 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4"
                  [attr.aria-label]="'CATALOG.TITLE' | translate"
                >
                  @for (product of results(); track product.id; let i = $index) {
                    <li>
                      <app-product-card
                        layout="grid"
                        [product]="product"
                        [tint]="tints[i % tints.length]"
                        [soldOut]="soldOut(product)"
                      />
                    </li>
                  }
                </ul>
              } @else if (products().length) {
                <div
                  class="flex flex-col items-start gap-4 rounded-card bg-blush p-8"
                  data-testid="no-results"
                >
                  <h2 class="m-0 text-h3">{{ 'CATALOG.NO_RESULTS.TITLE' | translate }}</h2>
                  <p class="m-0">{{ 'CATALOG.NO_RESULTS.TEXT' | translate }}</p>
                  <button
                    type="button"
                    class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush"
                    (click)="setQuery(clear(query()))"
                  >
                    {{ 'CATALOG.NO_RESULTS.CLEAR' | translate }}
                  </button>
                </div>
              } @else {
                <p class="m-0">{{ 'CATALOG.EMPTY' | translate }}</p>
              }
            }
          }
        </div>
      </div>
    </div>
  `,
})
export class ShopPage {
  protected readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private sheet: DialogRef<unknown, FilterSheet> | null = null;

  /** Query params, bound by withComponentInputBinding. */
  readonly absorbency = input<string>();
  readonly style = input<string>();
  readonly size = input<string>();
  readonly color = input<string>();
  readonly sort = input<string>();

  protected readonly query = computed(() =>
    parseCatalogQuery({
      absorbency: this.absorbency(),
      style: this.style(),
      size: this.size(),
      color: this.color(),
      sort: this.sort(),
    }),
  );

  protected readonly status = this.productService.status;
  protected readonly products = this.productService.products;
  protected readonly options = computed(() => catalogOptions(this.products()));
  protected readonly results = computed(() => applyCatalogQuery(this.products(), this.query()));
  protected readonly activeCount = computed(() => activeFilterCount(this.query()));
  protected readonly resultsKey = computed(() =>
    this.results().length === 1 ? 'CATALOG.RESULTS_ONE' : 'CATALOG.RESULTS_OTHER',
  );

  protected readonly sorts = CATALOG_SORTS;
  protected readonly sortKeys = SORT_KEYS;
  protected readonly tints = CARD_TINTS;
  protected readonly skeletons = Array.from({ length: SKELETONS }, (_, i) => i);
  protected readonly filtersIcon = SlidersHorizontal;
  protected readonly clear = clearFilters;
  protected readonly soldOut = isOutOfStock;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.sheet?.close());
  }

  /** Replaces the URL (not a new history entry per checkbox), keeping any unrelated params. */
  protected setQuery(query: CatalogQuery): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(query),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected setSort(sort: string): void {
    this.setQuery({ ...this.query(), sort: parseCatalogQuery({ sort }).sort });
  }

  protected openFilters(): void {
    if (this.sheet) return;
    const data: FilterSheetData = {
      query: this.query,
      options: this.options,
      resultCount: computed(() => this.results().length),
      change: (query) => this.setQuery(query),
    };
    this.sheet = this.dialog.open(FilterSheet, {
      data,
      ariaLabelledBy: FILTER_SHEET_TITLE_ID,
      ariaModal: true,
      autoFocus: 'first-heading',
      positionStrategy: createGlobalPositionStrategy(this.injector).bottom('0').left('0'),
      width: '100%',
      backdropClass: 'bg-plum/50',
    });
    this.sheet.closed.subscribe(() => (this.sheet = null));
  }
}
