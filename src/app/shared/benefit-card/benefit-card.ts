import { Component, input } from '@angular/core';

/** Numbered benefit (design/HOME.md section 4). Pass already-translated text. */
@Component({
  selector: 'app-benefit-card',
  host: { class: 'flex h-full flex-col gap-2.5 rounded-card bg-background p-7' },
  template: `
    <span
      class="flex size-13 items-center justify-center rounded-full font-brand text-xl font-semibold"
      [class]="circleClass()"
      aria-hidden="true"
      >{{ number() }}</span
    >
    <h3 class="m-0">{{ title() }}</h3>
    <p class="m-0">{{ text() }}</p>
  `,
})
export class BenefitCard {
  readonly number = input.required<number>();
  readonly title = input.required<string>();
  readonly text = input.required<string>();
  /** Theme background class for the number circle, e.g. `bg-sunny`. */
  readonly circleClass = input('bg-sunny');
}
