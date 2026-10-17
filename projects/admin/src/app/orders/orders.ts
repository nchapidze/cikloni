import {
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  resource,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ORDER_STATUSES, OrderListItem, OrderListPage, isOrderStatus } from '@cikloni/shared';
import { AdminOrdersApi } from '@cikloni/shared/admin';
import { LucideAngularModule, Search } from 'lucide-angular';
import { STATUS_LABELS, formatDateTime, formatGel } from './order-display';
import { OrderStatusBadge } from './order-status-badge';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const BUTTON_LINK =
  'inline-flex min-h-11 items-center rounded-pill border-2 border-plum px-5 font-semibold no-underline';

/**
 * Orders, newest first, filtered by status and searched by name, phone or order number.
 * Filters, search and page live in the URL, so back navigation and shared links keep them.
 */
@Component({
  selector: 'app-admin-orders-page',
  imports: [RouterLink, LucideAngularModule, OrderStatusBadge],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <h1 class="m-0 text-3xl md:text-h2">შეკვეთები</h1>

    <div class="flex flex-col gap-4">
      <div class="flex max-w-md flex-col gap-2">
        <label for="order-search" class="font-bold">ძებნა</label>
        <div class="relative">
          <lucide-icon
            class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
            [img]="searchIcon"
            [size]="20"
          />
          <input
            id="order-search"
            type="search"
            class="min-h-12 w-full rounded-chip border-2 border-plum bg-background pr-4 pl-12 text-plum"
            placeholder="სახელი, ტელეფონი ან შეკვეთის ნომერი"
            [value]="searchText()"
            (input)="onSearch($any($event.target).value)"
          />
        </div>
      </div>

      <nav aria-label="სტატუსის ფილტრი">
        <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
          @for (filter of filters; track filter.label) {
            @let active = activeStatus() === filter.value;
            <li>
              <a
                [class]="buttonLink"
                [class.bg-plum]="active"
                [class.text-blush]="active"
                [routerLink]="[]"
                [queryParams]="{ status: filter.value, page: null }"
                queryParamsHandling="merge"
                [attr.aria-current]="active ? 'page' : null"
                >{{ filter.label }}</a
              >
            </li>
          }
        </ul>
      </nav>
    </div>

    @let result = shown();
    @if (orders.error() && !orders.isLoading()) {
      <div class="flex flex-col items-start gap-4 rounded-card bg-blush p-6" role="alert">
        <p class="m-0">შეკვეთები ვერ ჩაიტვირთა.</p>
        <button
          type="button"
          class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush"
          (click)="orders.reload()"
        >
          თავიდან ცდა
        </button>
      </div>
    } @else if (!result) {
      <p class="m-0" role="status">იტვირთება…</p>
    } @else if (!result.orders.length) {
      <p class="m-0 rounded-card bg-blush p-6" role="status">შეკვეთები ვერ მოიძებნა.</p>
    } @else {
      @let last = rangeStart() + result.orders.length - 1;
      <div
        class="flex flex-col gap-4 transition-opacity"
        [class.opacity-60]="orders.isLoading()"
        [attr.aria-busy]="orders.isLoading()"
      >
        <!-- Phones: one card per order. -->
        <ul class="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
          @for (order of result.orders; track order.id) {
            <li>
              <a
                class="flex flex-col gap-2 rounded-card border-2 border-border bg-background p-4 no-underline"
                [routerLink]="order.id"
              >
                <span class="flex items-center justify-between gap-3">
                  <span class="font-brand text-lg font-semibold">{{ order.orderNumber }}</span>
                  <app-order-status-badge [status]="order.status" />
                </span>
                <span class="font-semibold">{{ order.customerName }}</span>
                <span class="flex justify-between gap-3 text-sm">
                  <span>{{ order.city }} · {{ date(order) }}</span>
                  <span class="font-bold whitespace-nowrap">{{ gel(order.totalGel) }}</span>
                </span>
              </a>
            </li>
          }
        </ul>

        <!-- Tablets and up: a table. -->
        <div class="hidden overflow-x-auto rounded-card border-2 border-border md:block">
          <table class="w-full border-collapse text-left">
            <thead class="bg-blush">
              <tr>
                <th scope="col" class="px-4 py-3">ნომერი</th>
                <th scope="col" class="px-4 py-3">თარიღი</th>
                <th scope="col" class="px-4 py-3">მომხმარებელი</th>
                <th scope="col" class="px-4 py-3">ქალაქი</th>
                <th scope="col" class="px-4 py-3 text-right">ჯამი</th>
                <th scope="col" class="px-4 py-3">სტატუსი</th>
              </tr>
            </thead>
            <tbody>
              @for (order of result.orders; track order.id) {
                <tr class="border-t-2 border-border hover:bg-blush/50">
                  <td class="px-4 py-2">
                    <a
                      class="inline-flex min-h-11 items-center font-brand font-semibold"
                      [routerLink]="order.id"
                      >{{ order.orderNumber }}</a
                    >
                  </td>
                  <td class="px-4 py-2 whitespace-nowrap">{{ date(order) }}</td>
                  <td class="px-4 py-2">{{ order.customerName }}</td>
                  <td class="px-4 py-2">{{ order.city }}</td>
                  <td class="px-4 py-2 text-right font-bold whitespace-nowrap">
                    {{ gel(order.totalGel) }}
                  </td>
                  <td class="px-4 py-2"><app-order-status-badge [status]="order.status" /></td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <nav aria-label="გვერდები" class="flex flex-wrap items-center justify-between gap-3">
          <p class="m-0" aria-live="polite">{{ rangeStart() }}–{{ last }} / {{ result.total }}</p>
          <div class="flex gap-2">
            @if (currentPage() > 1) {
              <a
                [class]="buttonLink"
                [routerLink]="[]"
                [queryParams]="{ page: currentPage() === 2 ? null : currentPage() - 1 }"
                queryParamsHandling="merge"
                >წინა</a
              >
            }
            @if (last < result.total) {
              <a
                [class]="buttonLink"
                [routerLink]="[]"
                [queryParams]="{ page: currentPage() + 1 }"
                queryParamsHandling="merge"
                >შემდეგი</a
              >
            }
          </div>
        </nav>
      </div>
    }
  `,
})
export class AdminOrdersPage {
  private readonly api = inject(AdminOrdersApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Query params, bound by withComponentInputBinding. */
  readonly status = input<string>();
  readonly q = input<string>();
  readonly page = input(1, { transform: (value: unknown) => numberAttribute(value, 1) });

  protected readonly searchIcon = Search;
  protected readonly buttonLink = BUTTON_LINK;
  protected readonly filters = [
    { value: null, label: 'ყველა' },
    ...ORDER_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
  ];

  protected readonly activeStatus = computed(() => {
    const status = this.status();
    return isOrderStatus(status) ? status : null;
  });
  protected readonly currentPage = computed(() => Math.max(1, Math.floor(this.page())));
  protected readonly rangeStart = computed(() => (this.currentPage() - 1) * PAGE_SIZE + 1);

  /** What the box shows: follows the URL (e.g. on back), but updates it only after a pause. */
  protected readonly searchText = linkedSignal(() => this.q() ?? '');
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly orders = resource({
    params: () => ({
      status: this.activeStatus() ?? undefined,
      search: this.q()?.trim() || undefined,
      offset: this.rangeStart() - 1,
      limit: PAGE_SIZE,
    }),
    loader: ({ params, abortSignal }) => this.api.listOrders(params, abortSignal),
  });

  /** Keeps the previous page on screen (dimmed) while the next one loads. */
  protected readonly shown = linkedSignal<OrderListPage | undefined, OrderListPage | undefined>({
    source: () => (this.orders.hasValue() ? this.orders.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });

  protected readonly gel = formatGel;
  protected readonly date = (order: OrderListItem) => formatDateTime(order.createdAt);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.searchTimer));
  }

  protected onSearch(value: string): void {
    this.searchText.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: value.trim() || null, page: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }, SEARCH_DEBOUNCE_MS);
  }
}
