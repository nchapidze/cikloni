import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '@cikloni/shared';
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from './order-display';

@Component({
  selector: 'app-order-status-badge',
  host: { class: 'inline-flex' },
  template: `
    <span
      class="inline-flex items-center rounded-pill px-3 py-1 text-sm font-semibold whitespace-nowrap text-plum"
      [class]="badgeClass()"
      >{{ label() }}</span
    >
  `,
})
export class OrderStatusBadge {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() => STATUS_LABELS[this.status()]);
  protected readonly badgeClass = computed(() => STATUS_BADGE_CLASSES[this.status()]);
}
