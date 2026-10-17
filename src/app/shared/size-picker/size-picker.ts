import { Component, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Size } from '@cikloni/shared';

/** XS-XXL size buttons; the selected one is filled plum (design/PRODUCT.md). */
@Component({
  selector: 'app-size-picker',
  imports: [TranslatePipe],
  template: `
    <fieldset class="m-0 border-0 p-0">
      <legend class="mb-2.5 p-0 font-bold">{{ 'PRODUCT.SIZE.LABEL' | translate }}</legend>
      <div class="flex flex-wrap gap-2.5">
        @for (size of sizes(); track size) {
          <button
            type="button"
            class="min-h-12 min-w-14 cursor-pointer rounded-chip border-2 border-plum bg-background px-3 font-bold text-plum aria-pressed:bg-plum aria-pressed:text-blush"
            [attr.aria-pressed]="size === selected()"
            (click)="selected.set(size)"
          >
            {{ size }}
          </button>
        }
      </div>
    </fieldset>
  `,
})
export class SizePicker {
  readonly sizes = input.required<readonly Size[]>();
  readonly selected = model.required<Size>();
}
