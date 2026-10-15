import { Component, computed, input } from '@angular/core';
import { Droplet, LucideAngularModule } from 'lucide-angular';

/**
 * Three drops, the first `level` filled coral (design/HOME.md section 7, PRODUCT.md).
 * Decorative by default; pass `label` (e.g. "Absorbency: Medium") to expose it as an image.
 */
@Component({
  selector: 'app-absorbency-drops',
  imports: [LucideAngularModule],
  host: {
    class: 'inline-flex gap-1.5 text-plum',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  template: `
    @for (filled of drops(); track $index) {
      <lucide-icon
        [img]="icon"
        [size]="size()"
        [class]="filled ? 'fill-coral' : 'fill-transparent'"
        data-testid="drop"
        [attr.data-filled]="filled"
      />
    }
  `,
})
export class AbsorbencyDrops {
  /** Number of filled drops, 1-3. */
  readonly level = input.required<1 | 2 | 3>();
  readonly size = input(26);
  readonly label = input<string>();

  protected readonly icon = Droplet;
  protected readonly drops = computed(() => [1, 2, 3].map((i) => i <= this.level()));
}
