import { Component, inject, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminProductListItem, LOW_STOCK_THRESHOLD } from '@cikloni/shared';
import { AdminProductsApi } from '@cikloni/shared/admin';
import { ImageOff, LucideAngularModule, Plus, TriangleAlert } from 'lucide-angular';
import { ToastService } from '../ui/toast/toast.service';
import { formatGel } from '../ui/format';
import { ABSORBENCY_LABELS } from './product-display';

/** All products, active or not, with stock at a glance and an is_active switch. */
@Component({
  selector: 'app-admin-products-page',
  imports: [RouterLink, LucideAngularModule],
  host: { class: 'flex flex-col gap-6' },
  template: `
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="m-0 text-3xl md:text-h2">პროდუქტები</h1>
      <a
        routerLink="new"
        class="inline-flex min-h-12 items-center gap-2 rounded-pill bg-plum px-6 font-bold text-blush no-underline"
      >
        <lucide-icon [img]="plusIcon" [size]="20" />
        ახალი პროდუქტი
      </a>
    </div>

    @if (products.error() && !products.isLoading()) {
      <div class="flex flex-col items-start gap-4 rounded-card bg-blush p-6" role="alert">
        <p class="m-0">პროდუქტები ვერ ჩაიტვირთა.</p>
        <button
          type="button"
          class="min-h-11 cursor-pointer rounded-pill border-0 bg-plum px-6 font-bold text-blush"
          (click)="products.reload()"
        >
          თავიდან ცდა
        </button>
      </div>
    } @else if (!products.hasValue()) {
      <p class="m-0" role="status">იტვირთება…</p>
    } @else if (!products.value().length) {
      <p class="m-0 rounded-card bg-blush p-6">პროდუქტები ჯერ არ არის.</p>
    } @else {
      <ul class="m-0 flex list-none flex-col gap-3 p-0">
        @for (product of products.value(); track product.id) {
          @let active = isActive(product);
          <li
            class="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card border-2 border-border bg-background p-3 md:flex-nowrap"
          >
            <a
              class="flex min-w-0 flex-1 basis-64 items-center gap-4 no-underline"
              [routerLink]="product.id"
            >
              @if (product.imageUrl) {
                <img
                  class="size-16 shrink-0 rounded-chip bg-blush object-cover"
                  [src]="product.imageUrl"
                  alt=""
                  width="64"
                  height="64"
                  loading="lazy"
                />
              } @else {
                <span
                  class="flex size-16 shrink-0 items-center justify-center rounded-chip bg-blush"
                  title="სურათი არ არის"
                >
                  <lucide-icon [img]="noImageIcon" [size]="24" />
                </span>
              }
              <span class="flex min-w-0 flex-col">
                <span class="truncate font-bold underline-offset-2 hover:underline">{{
                  product.name.ka
                }}</span>
                <span class="truncate text-sm">{{ product.slug }}</span>
              </span>
            </a>

            <dl class="m-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div class="flex flex-col">
                <dt class="sr-only md:not-sr-only">ფასი</dt>
                <dd class="m-0 font-bold whitespace-nowrap">{{ price(product) }}</dd>
              </div>
              <div class="flex flex-col">
                <dt class="sr-only md:not-sr-only">შთანთქმა</dt>
                <dd class="m-0">{{ absorbency[product.absorbency] }}</dd>
              </div>
              <div class="flex flex-col">
                <dt class="sr-only md:not-sr-only">მარაგი</dt>
                <dd class="m-0 flex items-center gap-2">
                  @if (product.variantCount) {
                    <span class="whitespace-nowrap">{{ product.totalStock }} ც.</span>
                  } @else {
                    <span>ვარიანტები არ არის</span>
                  }
                  @if (product.lowStock) {
                    <span
                      class="inline-flex items-center gap-1 rounded-pill bg-sunny px-2 py-0.5 font-semibold whitespace-nowrap"
                      [title]="lowStockHint"
                    >
                      <lucide-icon [img]="lowStockIcon" [size]="14" />
                      მარაგი იწურება
                    </span>
                  }
                </dd>
              </div>
            </dl>

            <button
              type="button"
              role="switch"
              class="ml-auto inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-3 border-0 bg-transparent px-1 font-semibold text-plum disabled:cursor-wait"
              [attr.aria-checked]="active"
              [attr.aria-label]="'აქტიური: ' + product.name.ka"
              [disabled]="saving().has(product.id)"
              (click)="toggleActive(product)"
            >
              <span
                class="relative inline-flex h-7 w-12 items-center rounded-pill border-2 border-plum transition-colors"
                [class]="active ? 'bg-plum' : 'bg-background'"
                aria-hidden="true"
              >
                <span
                  class="absolute size-5 rounded-pill transition-transform"
                  [class]="active ? 'translate-x-5 bg-blush' : 'translate-x-0.5 bg-plum'"
                ></span>
              </span>
              <span class="w-20 text-sm" aria-hidden="true">{{
                active ? 'აქტიური' : 'დამალული'
              }}</span>
            </button>
          </li>
        }
      </ul>
    }
  `,
})
export class AdminProductsPage {
  private readonly api = inject(AdminProductsApi);
  private readonly toast = inject(ToastService);

  protected readonly plusIcon = Plus;
  protected readonly noImageIcon = ImageOff;
  protected readonly lowStockIcon = TriangleAlert;
  protected readonly absorbency = ABSORBENCY_LABELS;
  protected readonly lowStockHint = `რომელიმე ვარიანტის მარაგი ${LOW_STOCK_THRESHOLD} ან ნაკლებია`;

  protected readonly products = resource({
    loader: ({ abortSignal }) => this.api.listProducts(abortSignal),
  });

  /** is_active changes made here, shown right away (the list is not reloaded). */
  private readonly activeOverrides = signal<ReadonlyMap<string, boolean>>(new Map());
  protected readonly saving = signal<ReadonlySet<string>>(new Set());

  protected isActive(product: AdminProductListItem): boolean {
    return this.activeOverrides().get(product.id) ?? product.isActive;
  }

  protected price(product: AdminProductListItem): string {
    return product.priceGel === null ? 'ფასი არ არის' : formatGel(product.priceGel);
  }

  protected async toggleActive(product: AdminProductListItem): Promise<void> {
    const next = !this.isActive(product);
    this.setOverride(product.id, next);
    this.saving.update((ids) => new Set(ids).add(product.id));
    try {
      await this.api.setActive(product.id, next);
      this.toast.success(
        next ? `„${product.name.ka}“ ჩანს მაღაზიაში.` : `„${product.name.ka}“ დაიმალა მაღაზიიდან.`,
      );
    } catch {
      this.setOverride(product.id, !next);
      this.toast.error(`„${product.name.ka}“-ის სტატუსი ვერ შეიცვალა. სცადეთ თავიდან.`);
    } finally {
      this.saving.update((ids) => {
        const rest = new Set(ids);
        rest.delete(product.id);
        return rest;
      });
    }
  }

  private setOverride(id: string, isActive: boolean): void {
    this.activeOverrides.update((map) => new Map(map).set(id, isActive));
  }
}
