import { Component, input } from '@angular/core';

/**
 * The cikloni spiral mark: "eye of the cyclone".
 * `color` sets the spiral, `dotColor` the calm center dot. Both accept any CSS color; use the
 * Tailwind theme variables, e.g. `var(--color-blush)` for the dot on dark sections.
 * The spiral rotates around the dot at (100, 100), the center of the viewBox is (100, 114).
 * While spinning, the outer arm sweeps past the viewBox edges, so the svg is overflow-visible and
 * the parent must leave room around it.
 */
@Component({
  selector: 'app-logo-mark',
  host: { class: 'inline-flex shrink-0' },
  template: `
    <svg
      viewBox="34 48 132 132"
      class="block"
      [class.overflow-visible]="spin()"
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
        style="transform-box: view-box; transform-origin: 100px 100px"
        [attr.class]="spin() ? 'motion-safe:animate-cyclone' : null"
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
  /** Slowly turns the spiral around the still center dot (off for prefers-reduced-motion). */
  readonly spin = input(false);
}
