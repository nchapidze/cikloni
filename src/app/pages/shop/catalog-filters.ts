import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ABSORBENCY, LocalizedPipe, PRODUCT_STYLE_LABELS } from '@cikloni/shared';
import {
  CatalogFilter,
  CatalogOptions,
  CatalogQuery,
  toggleValue,
} from '../../core/catalog/catalog-query';

/**
 * The catalog filters as checkbox groups. Rendered twice (desktop sidebar, mobile bottom
 * sheet), so it uses wrapping labels instead of ids. Every change is applied right away.
 */
@Component({
  selector: 'app-catalog-filters',
  imports: [TranslatePipe, LocalizedPipe],
  host: { class: 'flex flex-col gap-8' },
  template: `
    @if (options().absorbency.length) {
      <fieldset class="m-0 flex flex-col gap-1 border-0 p-0">
        <legend class="mb-2 p-0 font-bold">{{ 'CATALOG.FILTERS.ABSORBENCY' | translate }}</legend>
        @for (level of options().absorbency; track level) {
          <label class="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              class="size-5 shrink-0 cursor-pointer accent-plum"
              [checked]="query().absorbency.includes(level)"
              (change)="toggle('absorbency', level)"
            />
            {{ absorbency[level].nameKey | translate }}
          </label>
        }
      </fieldset>
    }

    @if (options().style.length) {
      <fieldset class="m-0 flex flex-col gap-1 border-0 p-0">
        <legend class="mb-2 p-0 font-bold">{{ 'CATALOG.FILTERS.STYLE' | translate }}</legend>
        @for (style of options().style; track style) {
          <label class="flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              class="size-5 shrink-0 cursor-pointer accent-plum"
              [checked]="query().style.includes(style)"
              (change)="toggle('style', style)"
            />
            {{ styleLabels[style] | localized }}
          </label>
        }
      </fieldset>
    }

    @if (options().size.length) {
      <fieldset class="m-0 border-0 p-0">
        <legend class="mb-3 p-0 font-bold">{{ 'CATALOG.FILTERS.SIZE' | translate }}</legend>
        <div class="flex flex-wrap gap-2">
          @for (size of options().size; track size) {
            <label class="cursor-pointer">
              <input
                type="checkbox"
                class="peer sr-only"
                [checked]="query().size.includes(size)"
                (change)="toggle('size', size)"
              />
              <span
                class="flex h-11 min-w-12 items-center justify-center rounded-chip border-2 border-plum px-3 font-brand font-semibold peer-checked:bg-plum peer-checked:text-blush peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-plum"
                >{{ size }}</span
              >
            </label>
          }
        </div>
      </fieldset>
    }

    @if (options().color.length) {
      <fieldset class="m-0 border-0 p-0">
        <legend class="mb-3 p-0 font-bold">{{ 'CATALOG.FILTERS.COLOR' | translate }}</legend>
        <div class="flex flex-wrap gap-3">
          @for (color of options().color; track color.id) {
            @let name = color.name | localized;
            <label class="cursor-pointer" [title]="name">
              <input
                type="checkbox"
                class="peer sr-only"
                [checked]="query().color.includes(color.id)"
                (change)="toggle('color', color.id)"
              />
              <span class="sr-only">{{ name }}</span>
              <span
                class="block size-11 rounded-full border-3 border-background ring-1 ring-plum/50 peer-checked:ring-3 peer-checked:ring-plum peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-plum"
                [style.background-color]="color.swatch"
                aria-hidden="true"
              ></span>
            </label>
          }
        </div>
      </fieldset>
    }
  `,
})
export class CatalogFilters {
  readonly query = input.required<CatalogQuery>();
  readonly options = input.required<CatalogOptions>();
  readonly queryChange = output<CatalogQuery>();

  protected readonly absorbency = ABSORBENCY;
  protected readonly styleLabels = PRODUCT_STYLE_LABELS;

  protected toggle<K extends CatalogFilter>(filter: K, value: CatalogQuery[K][number]): void {
    this.queryChange.emit(toggleValue(this.query(), filter, value));
  }
}
