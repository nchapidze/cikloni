import { Component, computed, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ColorId, ProductColor } from '../../core/products/product.model';
import { LocalizedPipe } from '../localized/localized.pipe';

/** Round color swatches with the selected color named in the legend (design/PRODUCT.md). */
@Component({
  selector: 'app-color-swatch-picker',
  imports: [TranslatePipe, LocalizedPipe],
  template: `
    <fieldset class="m-0 border-0 p-0">
      <legend class="mb-2.5 p-0 font-bold">
        {{ 'PRODUCT.COLOR.LABEL' | translate: { color: (current().name | localized) } }}
      </legend>
      <div class="flex flex-wrap gap-3">
        @for (color of colors(); track color.id) {
          <button
            type="button"
            class="size-12 cursor-pointer rounded-full border-3 border-background ring-1 ring-plum/50 focus-visible:outline-offset-4 aria-pressed:ring-3 aria-pressed:ring-plum"
            [style.background-color]="color.swatch"
            [attr.aria-label]="color.name | localized"
            [attr.aria-pressed]="color.id === selected()"
            (click)="selected.set(color.id)"
          ></button>
        }
      </div>
    </fieldset>
  `,
})
export class ColorSwatchPicker {
  readonly colors = input.required<readonly ProductColor[]>();
  readonly selected = model.required<ColorId>();

  protected readonly current = computed(
    () => this.colors().find((c) => c.id === this.selected()) ?? this.colors()[0],
  );
}
