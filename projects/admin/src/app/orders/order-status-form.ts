import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import {
  ORDER_STATUSES,
  OrderStatus,
  StatusChangeFailure,
  canChangeStatus,
  isOrderStatus,
} from '@cikloni/shared';
import { AdminOrdersApi, StatusChangeError } from '@cikloni/shared/admin';
import { STATUS_LABELS } from './order-display';

const FAILURE_MESSAGES: Record<StatusChangeFailure, string> = {
  STATUS_CHANGED: 'სტატუსი ამასობაში სხვამ შეცვალა. ნაჩვენებია განახლებული მონაცემები.',
  INVALID_TRANSITION: 'ამ სტატუსზე გადასვლა შეუძლებელია.',
  ORDER_NOT_FOUND: 'შეკვეთა ვერ მოიძებნა.',
  FORBIDDEN: 'სტატუსის შეცვლის უფლება არ გაქვთ.',
  NETWORK: 'სტატუსი ვერ შეიცვალა. სცადეთ თავიდან.',
};

/** Failures after which the page should reload the order, since it is out of date. */
const RELOAD_ON: readonly StatusChangeFailure[] = ['STATUS_CHANGED', 'INVALID_TRANSITION'];

/** Status dropdown with a save button. Cancelling shows what it does before it is saved. */
@Component({
  selector: 'app-order-status-form',
  host: { class: 'flex flex-col gap-3' },
  template: `
    @let locked = !hasNextStatus();
    <label for="order-status" class="font-bold">სტატუსი</label>
    <select
      id="order-status"
      class="min-h-12 w-full cursor-pointer rounded-chip border-2 border-plum bg-background px-4 text-plum disabled:cursor-not-allowed disabled:opacity-60"
      [disabled]="locked || saving()"
      (change)="select($any($event.target).value)"
    >
      @for (option of options(); track option.value) {
        <option
          [value]="option.value"
          [selected]="option.value === selected()"
          [disabled]="!option.allowed"
        >
          {{ option.label }}
        </option>
      }
    </select>

    @if (status() === 'cancelled') {
      <p class="m-0 text-sm">შეკვეთა გაუქმებულია, ნივთები მარაგში დაბრუნდა.</p>
    } @else if (status() === 'delivered') {
      <p class="m-0 text-sm">შეკვეთა მიწოდებულია.</p>
    } @else if (selected() === 'cancelled') {
      <p class="m-0 rounded-chip bg-sunny-tint p-3 text-sm" role="alert">
        გაუქმებისას შეკვეთის ნივთები მარაგში დაბრუნდება. გაუქმებულ შეკვეთას ვეღარ აღადგენთ.
      </p>
    }

    @if (!locked) {
      <button
        type="button"
        class="min-h-12 cursor-pointer rounded-pill border-0 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-60"
        [class]="selected() === 'cancelled' ? 'bg-coral-strong text-plum' : 'bg-plum text-blush'"
        [disabled]="!dirty() || saving()"
        (click)="save()"
      >
        @if (saving()) {
          ინახება…
        } @else if (selected() === 'cancelled') {
          შეკვეთის გაუქმება
        } @else {
          სტატუსის შენახვა
        }
      </button>
    }

    <p class="m-0 text-sm font-semibold empty:hidden" aria-live="polite">{{ message() }}</p>
  `,
})
export class OrderStatusForm {
  private readonly api = inject(AdminOrdersApi);

  readonly orderId = input.required<string>();
  readonly status = input.required<OrderStatus>();
  /** Emitted when the order changed (saved, or found out of date), so the page reloads it. */
  readonly changed = output();

  protected readonly selected = linkedSignal(() => this.status());
  protected readonly saving = signal(false);
  protected readonly message = signal('');

  protected readonly dirty = computed(() => this.selected() !== this.status());
  protected readonly options = computed(() =>
    ORDER_STATUSES.map((value) => ({
      value,
      label: STATUS_LABELS[value],
      allowed: canChangeStatus(this.status(), value),
    })),
  );
  protected readonly hasNextStatus = computed(() =>
    this.options().some((option) => option.allowed && option.value !== this.status()),
  );

  protected select(value: string): void {
    if (isOrderStatus(value)) this.selected.set(value);
    this.message.set('');
  }

  protected async save(): Promise<void> {
    const from = this.status();
    const to = this.selected();
    if (from === to || this.saving()) return;

    this.saving.set(true);
    this.message.set('');
    try {
      await this.api.setStatus(this.orderId(), from, to);
      this.message.set(`სტატუსი შეიცვალა: ${STATUS_LABELS[to]}.`);
      this.changed.emit();
    } catch (e) {
      const failure = e instanceof StatusChangeError ? e.failure : 'NETWORK';
      this.message.set(FAILURE_MESSAGES[failure]);
      if (RELOAD_ON.includes(failure)) this.changed.emit();
    } finally {
      this.saving.set(false);
    }
  }
}
