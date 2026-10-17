import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CircleCheck, LucideAngularModule } from 'lucide-angular';
import { OrderConfirmations } from '../../core/checkout/order-confirmations';
import { OrderSummary, OrderSummaryLine } from '../../shared/order-summary/order-summary';

/**
 * Thank-you page after checkout. The summary comes from this tab's session; opened anywhere
 * else (or after the tab closed) it shows the order number and next steps only.
 */
@Component({
  selector: 'app-order-page',
  imports: [RouterLink, TranslatePipe, LucideAngularModule, OrderSummary],
  template: `
    @let order = confirmation();

    <div class="mx-auto flex max-w-page flex-col gap-10 px-6 pt-10 pb-20">
      <div class="flex flex-col items-center gap-3 text-center">
        <lucide-icon class="text-mint-strong" [img]="checkIcon" [size]="56" aria-hidden="true" />
        <h1 class="m-0 text-4xl md:text-h1">{{ 'ORDER.TITLE' | translate }}</h1>
        <p class="m-0 text-lg">
          {{ 'ORDER.NUMBER' | translate }}:
          <strong class="font-brand text-xl" data-testid="order-number">{{ orderNumber() }}</strong>
        </p>
      </div>

      <div class="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        @if (order) {
          <app-order-summary
            class="lg:order-last lg:w-95 lg:shrink-0"
            [lines]="lines()"
            [deliveryFeeGel]="order.deliveryFeeGel"
            [deliveryLabel]="deliveryKey() + '.NAME'"
          />
        }

        <div class="flex min-w-0 flex-1 flex-col gap-8">
          <section class="flex flex-col gap-4" aria-labelledby="order-next-title">
            <h2 id="order-next-title" class="m-0 text-h3">
              {{ 'ORDER.NEXT.TITLE' | translate }}
            </h2>
            <ol class="m-0 flex list-none flex-col gap-3 p-0" data-testid="order-next">
              @for (step of nextSteps(); track step; let i = $index) {
                <li class="flex items-start gap-3">
                  <span
                    class="flex size-8 shrink-0 items-center justify-center rounded-full bg-sunny font-brand font-semibold"
                    aria-hidden="true"
                    >{{ i + 1 }}</span
                  >
                  <span class="pt-0.5">{{ step | translate }}</span>
                </li>
              }
            </ol>
          </section>

          @if (order) {
            <section class="flex flex-col gap-2" aria-labelledby="order-delivery-title">
              <h2 id="order-delivery-title" class="m-0 text-h3">
                {{ 'ORDER.DELIVERY_TITLE' | translate }}
              </h2>
              <p class="m-0" data-testid="order-delivery">
                {{ order.customer.name }}<br />
                {{ order.customer.phone }}<br />
                {{ order.city }}, {{ order.customer.address }}
              </p>
            </section>
          }

          <a
            routerLink="/"
            fragment="shop"
            class="flex min-h-14 items-center justify-center self-start rounded-pill bg-plum px-8 py-2 font-bold text-blush no-underline"
            >{{ 'ORDER.CONTINUE' | translate }}</a
          >
        </div>
      </div>
    </div>
  `,
})
export class OrderPage {
  private readonly confirmations = inject(OrderConfirmations);

  /** Bound from the `:orderNumber` route param. */
  readonly orderNumber = input.required<string>();

  protected readonly confirmation = computed(() => this.confirmations.get(this.orderNumber()));
  protected readonly checkIcon = CircleCheck;

  protected readonly deliveryKey = computed(() => {
    const method = this.confirmation()?.deliveryMethod;
    return method ? `CHECKOUT.DELIVERY.METHODS.${method.toUpperCase()}` : '';
  });

  protected readonly lines = computed<OrderSummaryLine[]>(
    () =>
      this.confirmation()?.items.map((item, index) => ({
        id: String(index),
        name: item.productName,
        color: item.colorName,
        size: item.size,
        quantity: item.quantity,
        unitPriceGel: item.unitPriceGel,
      })) ?? [],
  );

  protected readonly nextSteps = computed(() => {
    const order = this.confirmation();
    return [
      'ORDER.NEXT.CONFIRM',
      order
        ? `ORDER.NEXT.DELIVERY.${order.deliveryMethod.toUpperCase()}`
        : 'ORDER.NEXT.DELIVERY.DEFAULT',
      // Every method has a step; without a confirmation, cash is the only method so far.
      `ORDER.NEXT.PAYMENT.${(order?.paymentMethod ?? 'cash').toUpperCase()}`,
      'ORDER.NEXT.DISCREET',
    ];
  });
}
