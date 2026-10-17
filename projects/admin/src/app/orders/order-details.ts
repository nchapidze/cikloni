import { Component, DestroyRef, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OrderDetails } from '@cikloni/shared';
import { AdminOrdersApi } from '@cikloni/shared/admin';
import { ArrowLeft, Check, Copy, LucideAngularModule } from 'lucide-angular';
import {
  courierAddress,
  deliveryLabel,
  formatDateTime,
  formatGel,
  paymentLabel,
  paymentStatusLabel,
} from './order-display';
import { OrderStatusBadge } from './order-status-badge';
import { OrderStatusForm } from './order-status-form';

const COPY_MESSAGE_MS = 2500;

/** One order: items and totals, status, customer and delivery address. */
@Component({
  selector: 'app-admin-order-details-page',
  imports: [RouterLink, LucideAngularModule, OrderStatusBadge, OrderStatusForm],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <a class="inline-flex min-h-11 items-center gap-2 self-start font-semibold" routerLink="..">
      <lucide-icon [img]="backIcon" [size]="20" />
      ყველა შეკვეთა
    </a>

    @if (order.error() && !order.isLoading()) {
      <div class="flex flex-col items-start gap-4 rounded-card bg-blush p-6" role="alert">
        <p class="m-0">შეკვეთა ვერ ჩაიტვირთა.</p>
        <button
          type="button"
          class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush"
          (click)="order.reload()"
        >
          თავიდან ცდა
        </button>
      </div>
    } @else if (!order.hasValue()) {
      <p class="m-0" role="status">იტვირთება…</p>
    } @else if (order.value(); as o) {
      <header class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 class="m-0 font-brand text-3xl md:text-h2">{{ o.orderNumber }}</h1>
        <app-order-status-badge [status]="o.status" />
        <p class="m-0 w-full">{{ date(o) }}</p>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <section class="flex flex-col gap-4 lg:col-span-2" aria-labelledby="items-heading">
          <h2 id="items-heading" class="m-0 text-h3">ნივთები</h2>
          <ul class="m-0 flex list-none flex-col gap-3 p-0">
            @for (item of o.items; track item.id) {
              <li class="flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-panel bg-blush p-4">
                <span class="flex flex-col">
                  <span class="font-bold">{{ item.productName.ka }}</span>
                  <span class="text-sm">{{ item.colorName.ka }} · ზომა {{ item.size }}</span>
                </span>
                <span class="flex flex-col text-right">
                  <span class="font-bold">{{ gel(item.unitPriceGel * item.quantity) }}</span>
                  <span class="text-sm">{{ item.quantity }} × {{ gel(item.unitPriceGel) }}</span>
                </span>
              </li>
            }
          </ul>

          <dl class="m-0 flex flex-col gap-2 border-t-2 border-border pt-4">
            <div class="flex justify-between gap-4">
              <dt>პროდუქტები</dt>
              <dd class="m-0">{{ gel(o.subtotalGel) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt>მიწოდება — {{ delivery(o) }}</dt>
              <dd class="m-0">{{ gel(o.deliveryFeeGel) }}</dd>
            </div>
            <div class="flex justify-between gap-4 text-lg font-extrabold">
              <dt>სულ</dt>
              <dd class="m-0">{{ gel(o.totalGel) }}</dd>
            </div>
          </dl>
        </section>

        <div class="flex flex-col gap-6">
          <section class="rounded-card border-2 border-border p-5" aria-label="სტატუსი">
            <app-order-status-form
              [orderId]="o.id"
              [status]="o.status"
              (changed)="order.reload()"
            />
          </section>

          <section
            class="flex flex-col gap-4 rounded-card border-2 border-border p-5"
            aria-labelledby="customer-heading"
          >
            <h2 id="customer-heading" class="m-0 text-h3">მომხმარებელი</h2>
            <dl class="m-0 flex flex-col gap-3">
              <div>
                <dt class="text-sm">სახელი</dt>
                <dd class="m-0 font-semibold">{{ o.customerName }}</dd>
              </div>
              <div>
                <dt class="text-sm">ტელეფონი</dt>
                <dd class="m-0">
                  <a
                    class="inline-flex min-h-11 items-center font-semibold"
                    [href]="'tel:' + o.phone"
                  >
                    {{ o.phone }}
                  </a>
                </dd>
              </div>
              @if (o.email) {
                <div>
                  <dt class="text-sm">ელფოსტა</dt>
                  <dd class="m-0 break-all">
                    <a class="inline-flex min-h-11 items-center" [href]="'mailto:' + o.email">
                      {{ o.email }}
                    </a>
                  </dd>
                </div>
              }
              <div>
                <dt class="text-sm">მიწოდების მისამართი</dt>
                <dd class="m-0 font-semibold">{{ o.city }}, {{ o.address }}</dd>
              </div>
              @if (o.notes) {
                <div>
                  <dt class="text-sm">კომენტარი კურიერისთვის</dt>
                  <dd class="m-0 whitespace-pre-line">{{ o.notes }}</dd>
                </div>
              }
              <div>
                <dt class="text-sm">გადახდა</dt>
                <dd class="m-0">{{ payment(o) }} · {{ paymentStatus(o) }}</dd>
              </div>
            </dl>

            <button
              type="button"
              class="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-pill border-2 border-plum bg-background px-6 font-bold text-plum"
              (click)="copyAddress(o)"
            >
              <lucide-icon [img]="copyState() === 'copied' ? checkIcon : copyIcon" [size]="20" />
              მისამართის კოპირება
            </button>
            <p class="m-0 text-sm font-semibold empty:hidden" aria-live="polite">
              @switch (copyState()) {
                @case ('copied') {
                  დაკოპირდა: სახელი, ტელეფონი და მისამართი.
                }
                @case ('failed') {
                  ვერ დაკოპირდა. მონიშნეთ მისამართი ხელით.
                }
              }
            </p>
          </section>
        </div>
      </div>
    } @else {
      <div class="flex flex-col items-start gap-3 rounded-card bg-blush p-6" role="alert">
        <h1 class="m-0 text-3xl">შეკვეთა ვერ მოიძებნა</h1>
        <a class="inline-flex min-h-11 items-center" routerLink="..">ყველა შეკვეთა</a>
      </div>
    }
  `,
})
export class AdminOrderDetailsPage {
  private readonly api = inject(AdminOrdersApi);

  /** Route param, bound by withComponentInputBinding. */
  readonly id = input.required<string>();

  protected readonly backIcon = ArrowLeft;
  protected readonly copyIcon = Copy;
  protected readonly checkIcon = Check;

  /** reload() keeps the current order on screen while it refreshes. */
  protected readonly order = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.api.getOrder(params, abortSignal),
  });

  protected readonly copyState = signal<'idle' | 'copied' | 'failed'>('idle');
  private copyTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly gel = formatGel;
  protected readonly date = (o: OrderDetails) => formatDateTime(o.createdAt);
  protected readonly delivery = (o: OrderDetails) => deliveryLabel(o.deliveryMethod);
  protected readonly payment = (o: OrderDetails) => paymentLabel(o.paymentMethod);
  protected readonly paymentStatus = (o: OrderDetails) => paymentStatusLabel(o.paymentStatus);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.copyTimer));
  }

  protected async copyAddress(order: OrderDetails): Promise<void> {
    clearTimeout(this.copyTimer);
    try {
      await navigator.clipboard.writeText(courierAddress(order));
      this.copyState.set('copied');
    } catch {
      this.copyState.set('failed');
    }
    this.copyTimer = setTimeout(() => this.copyState.set('idle'), COPY_MESSAGE_MS);
  }
}
