import { Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedPipe, LocalizedText } from '@cikloni/shared';
import { PricePipe } from '../price/price.pipe';

export interface OrderSummaryLine {
  id: string;
  name: LocalizedText;
  color: LocalizedText;
  size: string;
  quantity: number;
  /** null until the product has a price. */
  unitPriceGel: number | null;
  /** Thumbnail background (a CSS color) and photo, when known. */
  tint?: string;
  imageUrl?: string;
}

/** Sums in tetri (1/100 GEL), so 3 × 39.90 is exactly 119.70. null if any amount is missing. */
function sumGel(amounts: (number | null)[]): number | null {
  let tetri = 0;
  for (const amount of amounts) {
    if (amount === null) return null;
    tetri += Math.round(amount * 100);
  }
  return tetri / 100;
}

function lineTotal(line: OrderSummaryLine): number | null {
  return line.unitPriceGel === null
    ? null
    : (Math.round(line.unitPriceGel * 100) * line.quantity) / 100;
}

/**
 * Lines, subtotal, delivery and total. On checkout the amounts are a preview from the catalog;
 * on the order page they are the ones the server charged.
 */
@Component({
  selector: 'app-order-summary',
  imports: [TranslatePipe, LocalizedPipe, PricePipe],
  host: { class: 'block' },
  template: `
    <section class="flex flex-col gap-4 rounded-card bg-blush p-6" aria-labelledby="summary-title">
      <h2 id="summary-title" class="m-0 text-h3">{{ 'CHECKOUT.SUMMARY.TITLE' | translate }}</h2>
      <ul class="m-0 flex list-none flex-col gap-4 p-0">
        @for (line of rows(); track line.id) {
          <li class="flex gap-3" data-testid="summary-line">
            <div
              class="size-16 shrink-0 overflow-hidden rounded-chip bg-background"
              aria-hidden="true"
              [style.background-color]="line.tint"
            >
              @if (line.imageUrl) {
                <img [src]="line.imageUrl" alt="" class="size-full object-cover" />
              }
            </div>
            <div class="flex min-w-0 flex-1 flex-col">
              <p class="m-0 font-bold">{{ line.name | localized }}</p>
              <p class="m-0 text-sm">
                {{ line.color | localized }} <span aria-hidden="true">·</span> {{ line.size }}
                <span aria-hidden="true">·</span>
                {{ 'CHECKOUT.SUMMARY.QUANTITY' | translate: { quantity: line.quantity } }}
              </p>
            </div>
            <p class="m-0 shrink-0 font-bold">{{ line.total | price }}</p>
          </li>
        }
      </ul>
      <dl class="m-0 flex flex-col gap-2 border-t border-border pt-4">
        <div class="flex justify-between gap-4">
          <dt>{{ 'CHECKOUT.SUMMARY.SUBTOTAL' | translate }}</dt>
          <dd class="m-0" data-testid="summary-subtotal">{{ subtotal() | price }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt>
            {{ 'CHECKOUT.SUMMARY.DELIVERY' | translate: { method: (deliveryLabel() | translate) } }}
          </dt>
          <dd class="m-0" data-testid="summary-delivery">{{ deliveryFeeGel() | price }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-4 text-xl font-bold">
          <dt>{{ 'CHECKOUT.SUMMARY.TOTAL' | translate }}</dt>
          <dd class="m-0" data-testid="summary-total">{{ total() | price }}</dd>
        </div>
      </dl>
    </section>
  `,
})
export class OrderSummary {
  readonly lines = input.required<readonly OrderSummaryLine[]>();
  readonly deliveryFeeGel = input.required<number>();
  /** Translation key of the delivery method name. */
  readonly deliveryLabel = input.required<string>();

  protected readonly rows = computed(() =>
    this.lines().map((line) => ({ ...line, total: lineTotal(line) })),
  );
  protected readonly subtotal = computed(() => sumGel(this.rows().map((row) => row.total)));
  protected readonly total = computed(() => sumGel([this.subtotal(), this.deliveryFeeGel()]));
}
