import { Component, input } from '@angular/core';

/**
 * The cikloni spiral mark: "eye of the cyclone".
 * `color` sets the spiral, `dotColor` the calm center dot. Both accept any CSS color; use the
 * Tailwind theme variables, e.g. `var(--color-blush)` for the dot on dark sections.
 */
@Component({
  selector: 'app-logo-mark',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      viewBox="34 48 132 132"
      class="block"
      [attr.width]="size()"
      [attr.height]="size()"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M100 114 A14 14 0 0 1 100 86 A28 28 0 0 1 100 142 A42 42 0 0 1 100 58 A56 56 0 0 1 100 170"
        fill="none"
        stroke-width="11"
        stroke-linecap="round"
        [style.stroke]="color()"
      />
      <circle cx="100" cy="100" r="6" [style.fill]="dotColor()" />
    </svg>
  `,
})
export class LogoMark {
  /** Width and height in px. */
  readonly size = input(40);
  readonly color = input('var(--color-coral)');
  readonly dotColor = input('var(--color-plum)');
}
