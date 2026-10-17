import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LOW_STOCK_THRESHOLD } from '@cikloni/shared';
import { AdminDashboardApi } from '@cikloni/shared/admin';
import { ChevronRight, LucideAngularModule, RefreshCw } from 'lucide-angular';
import { formatGel } from '../ui/format';

const monthName = new Intl.DateTimeFormat('ka-GE', { month: 'long', timeZone: 'Asia/Tbilisi' });

const CARD = 'flex flex-col gap-1 rounded-card p-5';

/** Home: this month at a glance. All numbers come from admin_dashboard() in the database. */
@Component({
  selector: 'app-admin-dashboard-page',
  imports: [RouterLink, LucideAngularModule],
  host: { class: 'flex flex-col gap-8' },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="m-0 text-3xl md:text-h2">მთავარი</h1>
      <button
        type="button"
        class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border-2 border-plum bg-background px-5 font-semibold text-plum disabled:cursor-wait disabled:opacity-60"
        [disabled]="dashboard.isLoading()"
        (click)="dashboard.reload()"
      >
        <lucide-icon [img]="refreshIcon" [size]="18" />
        განახლება
      </button>
    </div>

    @if (dashboard.error() && !dashboard.isLoading()) {
      <div class="flex flex-col items-start gap-4 rounded-card bg-blush p-6" role="alert">
        <p class="m-0">მონაცემები ვერ ჩაიტვირთა.</p>
        <button
          type="button"
          class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush"
          (click)="dashboard.reload()"
        >
          თავიდან ცდა
        </button>
      </div>
    } @else if (!dashboard.hasValue()) {
      <p class="m-0" role="status">იტვირთება…</p>
    } @else {
      @let d = dashboard.value();
      <section aria-label="მოკლე შეჯამება" [attr.aria-busy]="dashboard.isLoading()">
        <ul class="m-0 grid list-none grid-cols-1 gap-4 p-0 xs:grid-cols-2 lg:grid-cols-4">
          <li [class]="card" class="bg-blush">
            <span class="font-semibold">დღევანდელი შეკვეთები</span>
            <span class="font-brand text-h2 font-semibold">{{ d.ordersToday }}</span>
          </li>
          <li [class]="card" class="bg-lilac-tint">
            <span class="font-semibold">შეკვეთები · {{ month }}</span>
            <span class="font-brand text-h2 font-semibold">{{ d.ordersMonth }}</span>
          </li>
          <li [class]="card" class="bg-mint-tint">
            <span class="font-semibold">შემოსავალი · {{ month }}</span>
            <span class="font-brand text-h2 font-semibold whitespace-nowrap">{{
              gel(d.revenueMonthGel)
            }}</span>
            <span class="text-sm">მიწოდების ჩათვლით, გაუქმებულის გარეშე</span>
          </li>
          <li>
            <a
              routerLink="/orders"
              [queryParams]="{ status: 'new' }"
              [class]="card"
              class="h-full no-underline hover:outline-2 hover:outline-plum"
              [class.bg-sunny]="d.newOrders > 0"
              [class.bg-sunny-tint]="d.newOrders === 0"
            >
              <span class="flex items-center justify-between gap-2 font-semibold">
                დასადასტურებელი შეკვეთები
                <lucide-icon class="shrink-0" [img]="openIcon" [size]="20" />
              </span>
              <span class="font-brand text-h2 font-semibold">{{ d.newOrders }}</span>
              <span class="text-sm">სტატუსი „ახალი“ · ნახვა</span>
            </a>
          </li>
        </ul>
      </section>

      <div class="grid gap-8 xl:grid-cols-2">
        <section class="flex flex-col gap-4" aria-labelledby="best-sellers">
          <h2 id="best-sellers" class="m-0 text-h3">ბესტსელერები · {{ month }}</h2>
          @if (d.bestSellers.length) {
            <div class="overflow-x-auto rounded-card border-2 border-border">
              <table class="w-full border-collapse text-left">
                <thead class="bg-blush">
                  <tr>
                    <th scope="col" class="w-12 px-4 py-3">#</th>
                    <th scope="col" class="px-4 py-3">პროდუქტი</th>
                    <th scope="col" class="px-4 py-3 text-right">გაყიდული</th>
                    <th scope="col" class="px-4 py-3 text-right">შემოსავალი</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of d.bestSellers; track $index; let i = $index) {
                    <tr class="border-t-2 border-border">
                      <td class="px-4 py-3 font-brand">{{ i + 1 }}</td>
                      <td class="px-4 py-3">
                        @if (item.productId) {
                          <a class="font-semibold" [routerLink]="['/products', item.productId]">{{
                            item.name.ka
                          }}</a>
                        } @else {
                          {{ item.name.ka }} <span class="text-sm">(წაშლილი)</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right font-bold whitespace-nowrap">
                        {{ item.quantity }} ც.
                      </td>
                      <td class="px-4 py-3 text-right whitespace-nowrap">
                        {{ gel(item.revenueGel) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="m-0 rounded-card bg-blush p-5">ამ თვეში გაყიდვები ჯერ არ არის.</p>
          }
        </section>

        <section class="flex flex-col gap-4" aria-labelledby="low-stock">
          <h2 id="low-stock" class="m-0 text-h3">მარაგი იწურება</h2>
          <p class="m-0 -mt-2 text-sm">ვარიანტები, რომელთა მარაგი {{ threshold }} ან ნაკლებია.</p>
          @if (d.lowStock.length) {
            <ul class="m-0 flex list-none flex-col gap-2 p-0">
              @for (variant of d.lowStock; track variant.variantId) {
                <li>
                  <a
                    class="flex items-center justify-between gap-4 rounded-panel border-2 border-border p-4 no-underline hover:bg-blush/50"
                    [routerLink]="['/products', variant.productId]"
                  >
                    <span class="flex min-w-0 flex-col">
                      <span class="font-bold">
                        {{ variant.productName.ka }}
                        @if (!variant.isActive) {
                          <span
                            class="ml-1 rounded-pill bg-border px-2 py-0.5 text-sm font-semibold"
                          >
                            დამალული
                          </span>
                        }
                      </span>
                      <span class="text-sm">
                        {{ variant.colorName.ka }} · {{ variant.size }} · {{ variant.sku }}
                      </span>
                    </span>
                    <span
                      class="shrink-0 rounded-pill px-3 py-1 text-sm font-bold whitespace-nowrap"
                      [class]="variant.stock === 0 ? 'bg-coral-soft' : 'bg-sunny'"
                    >
                      {{ variant.stock === 0 ? 'ამოიწურა' : variant.stock + ' ც.' }}
                    </span>
                  </a>
                </li>
              }
            </ul>
          } @else {
            <p class="m-0 rounded-card bg-mint-tint p-5">ყველა ვარიანტის მარაგი საკმარისია.</p>
          }
        </section>
      </div>
    }
  `,
})
export class AdminDashboardPage {
  private readonly api = inject(AdminDashboardApi);

  protected readonly dashboard = resource({
    loader: ({ abortSignal }) => this.api.getDashboard(abortSignal),
  });

  /** e.g. "ოქტომბერი" (the current month in Tbilisi). */
  protected readonly month = monthName.format(new Date());
  protected readonly threshold = LOW_STOCK_THRESHOLD;
  protected readonly card = CARD;
  protected readonly gel = formatGel;
  protected readonly refreshIcon = RefreshCw;
  protected readonly openIcon = ChevronRight;
}
