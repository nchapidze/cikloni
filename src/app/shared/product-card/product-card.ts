import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ABSORBENCY, Product } from '../../core/products/product.model';
import { ProductService } from '../../core/products/product.service';

/** Bestseller card (design/HOME.md section 5); the whole card links to the product page. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, TranslatePipe],
  host: { class: 'block' },
  template: `
    @let name = product().nameKey | translate;
    @let level = absorbency().nameKey | translate;
    @let price =
      product().price === null
        ? ('PRODUCTS.PRICE_PLACEHOLDER' | translate)
        : ('PRODUCTS.PRICE' | translate: { price: product().price });

    <a
      [routerLink]="['/product', product().slug]"
      class="group flex flex-col gap-3 rounded-card text-plum no-underline focus-visible:outline-offset-4"
      [attr.aria-label]="'PRODUCTS.CARD_LABEL' | translate: { name, level, price }"
    >
      <!-- TODO: replace with the product photo. -->
      <div
        class="relative flex h-80 items-end rounded-card p-4 font-bold"
        [style.background-color]="cardColor()"
      >
        <span
          class="absolute top-3.5 left-3.5 rounded-pill bg-background px-3 py-1 text-xs font-bold"
          >{{ level }}</span
        >
        <span aria-hidden="true">{{ 'PRODUCTS.PHOTO' | translate }}</span>
      </div>
      <h3 class="m-0 text-lg group-hover:underline">{{ name }}</h3>
      <div class="flex items-center justify-between">
        <span class="font-medium">{{ price }}</span>
        <span class="flex gap-1.5" aria-hidden="true">
          @for (color of colors(); track color.id) {
            <span class="size-4 rounded-full" [style.background-color]="color.swatch"></span>
          }
        </span>
      </div>
    </a>
  `,
})
export class ProductCard {
  private readonly productService = inject(ProductService);

  readonly product = input.required<Product>();

  protected readonly absorbency = computed(() => ABSORBENCY[this.product().absorbency]);
  protected readonly colors = computed(() => this.productService.getColors(this.product()));
  protected readonly cardColor = computed(
    () => this.productService.getColor(this.product().cardColor).soft,
  );
}
