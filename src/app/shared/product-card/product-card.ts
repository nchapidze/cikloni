import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ABSORBENCY, Product, productImage } from '../../core/products/product.model';
import { CARD_TINTS } from '../../core/products/product.palette';
import { LocalizedPipe } from '../localized/localized.pipe';

/** Bestseller card (design/HOME.md section 5); the whole card links to the product page. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, TranslatePipe, LocalizedPipe],
  host: { class: 'block' },
  template: `
    @let name = product().name | localized;
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
      <div
        class="relative flex h-80 items-end overflow-hidden rounded-card p-4 font-bold"
        [style.background-color]="tint()"
      >
        @if (image(); as image) {
          <img [src]="image.url" alt="" class="absolute inset-0 size-full object-cover" />
        } @else {
          <span aria-hidden="true">{{ 'PRODUCTS.PHOTO' | translate }}</span>
        }
        <span
          class="absolute top-3.5 left-3.5 rounded-pill bg-background px-3 py-1 text-xs font-bold"
          >{{ level }}</span
        >
      </div>
      <h3 class="m-0 text-lg group-hover:underline">{{ name }}</h3>
      <div class="flex items-center justify-between">
        <span class="font-medium">{{ price }}</span>
        <span class="flex gap-1.5" aria-hidden="true">
          @for (color of product().colors; track color.id) {
            <span class="size-4 rounded-full" [style.background-color]="color.swatch"></span>
          }
        </span>
      </div>
    </a>
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  /** Background behind the photo (a CSS color). */
  readonly tint = input<string>(CARD_TINTS[0]);

  protected readonly absorbency = computed(() => ABSORBENCY[this.product().absorbency]);
  protected readonly image = computed(() => {
    const product = this.product();
    return productImage(product, product.defaultColor) ?? product.images[0];
  });
}
