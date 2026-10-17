import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, Signal, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, X } from 'lucide-angular';
import {
  CatalogOptions,
  CatalogQuery,
  activeFilterCount,
  clearFilters,
} from '../../core/catalog/catalog-query';
import { CatalogFilters } from './catalog-filters';

export const FILTER_SHEET_TITLE_ID = 'filter-sheet-title';

/** Live view of the page's state: the sheet applies changes right away, like the sidebar. */
export interface FilterSheetData {
  query: Signal<CatalogQuery>;
  options: Signal<CatalogOptions>;
  resultCount: Signal<number>;
  change: (query: CatalogQuery) => void;
}

/** Mobile filters: a bottom sheet (CDK dialog) with "Clear all" and "Show X products". */
@Component({
  selector: 'app-filter-sheet',
  imports: [TranslatePipe, LucideAngularModule, CatalogFilters],
  host: {
    class:
      'flex max-h-sheet flex-col rounded-t-hero bg-background shadow-2xl transition-transform duration-300 ease-out starting:translate-y-full motion-reduce:transition-none',
  },
  template: `
    <div class="flex items-center justify-between gap-4 border-b border-border py-3 pr-3 pl-6">
      <h2 [id]="titleId" class="m-0 text-h3">{{ 'CATALOG.FILTERS.TITLE' | translate }}</h2>
      <button
        type="button"
        class="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-plum hover:bg-blush"
        [attr.aria-label]="'CATALOG.FILTERS.CLOSE' | translate"
        (click)="ref.close()"
      >
        <lucide-icon [img]="closeIcon" [size]="22" />
      </button>
    </div>

    <app-catalog-filters
      class="flex-1 overflow-y-auto px-6 py-6"
      [query]="data.query()"
      [options]="data.options()"
      (queryChange)="data.change($event)"
    />

    @let count = data.resultCount();
    <div class="flex gap-3 border-t border-border px-6 py-4">
      <button
        type="button"
        class="min-h-12 grow basis-0 cursor-pointer rounded-pill border-2 border-plum bg-background px-4 font-bold text-plum disabled:cursor-not-allowed disabled:opacity-50"
        [disabled]="!activeCount()"
        (click)="data.change(clear(data.query()))"
      >
        {{ 'CATALOG.FILTERS.CLEAR' | translate }}
      </button>
      <button
        type="button"
        class="min-h-12 grow-2 basis-0 cursor-pointer rounded-pill border-0 bg-plum px-4 font-bold text-blush"
        (click)="ref.close()"
      >
        {{
          (count === 1 ? 'CATALOG.FILTERS.SHOW_RESULTS_ONE' : 'CATALOG.FILTERS.SHOW_RESULTS_OTHER')
            | translate: { count }
        }}
      </button>
    </div>
  `,
})
export class FilterSheet {
  protected readonly data = inject<FilterSheetData>(DIALOG_DATA);
  protected readonly ref = inject(DialogRef);
  protected readonly titleId = FILTER_SHEET_TITLE_ID;
  protected readonly closeIcon = X;
  protected readonly clear = clearFilters;

  protected activeCount(): number {
    return activeFilterCount(this.data.query());
  }
}
