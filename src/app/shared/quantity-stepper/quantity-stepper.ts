import { Component, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, Minus, Plus } from 'lucide-angular';

/**
 * Pill-shaped − / value / + control, clamped to [min, max] (design/PRODUCT.md: 1-10).
 * Uses aria-disabled rather than disabled at the limits so keyboard focus is not lost.
 */
@Component({
  selector: 'app-quantity-stepper',
  imports: [TranslatePipe, LucideAngularModule],
  host: { class: 'inline-flex' },
  template: `
    <div
      role="group"
      class="inline-flex items-center rounded-pill border-2 border-plum"
      [attr.aria-label]="label() ?? ('PRODUCT.QUANTITY.LABEL' | translate)"
    >
      <button
        type="button"
        class="flex h-13 w-12 cursor-pointer items-center justify-center rounded-l-pill border-0 bg-transparent text-plum aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
        [attr.aria-label]="'PRODUCT.QUANTITY.DECREASE' | translate"
        [attr.aria-disabled]="value() <= min()"
        (click)="step(-1)"
      >
        <lucide-icon [img]="icons.minus" [size]="20" />
      </button>
      <span class="min-w-8 text-center font-brand text-lg font-semibold" aria-live="polite">{{
        value()
      }}</span>
      <button
        type="button"
        class="flex h-13 w-12 cursor-pointer items-center justify-center rounded-r-pill border-0 bg-transparent text-plum aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
        [attr.aria-label]="'PRODUCT.QUANTITY.INCREASE' | translate"
        [attr.aria-disabled]="value() >= max()"
        (click)="step(1)"
      >
        <lucide-icon [img]="icons.plus" [size]="20" />
      </button>
    </div>
  `,
})
export class QuantityStepper {
  readonly value = model(1);
  readonly min = input(1);
  readonly max = input(10);
  /** Group label; defaults to "Quantity". Set it when several steppers share a page. */
  readonly label = input<string>();

  protected readonly icons = { minus: Minus, plus: Plus };

  protected step(delta: number): void {
    this.value.update((v) => Math.min(this.max(), Math.max(this.min(), v + delta)));
  }
}
