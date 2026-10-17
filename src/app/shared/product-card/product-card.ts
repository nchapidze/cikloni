import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ABSORBENCY, CARD_TINTS, LocalizedPipe, Product, productThumbnail } from '@cikloni/shared';

/** Product card (design/HOME.md section 5, and the /shop grid); the whole card is a link. */
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
    @let label = 'PRODUCTS.CARD_LABEL' | translate: { name, level, price };
    @let soldOutLabel = 'PRODUCTS.SOLD_OUT' | translate;

    <a
      [routerLink]="['/product', product().slug]"
      class="group flex flex-col gap-3 rounded-card text-plum no-underline focus-visible:outline-offset-4"
      [attr.aria-label]="soldOut() ? label + ', ' + soldOutLabel : label"
    >
      <div
        class="relative flex items-end overflow-hidden rounded-card p-4 font-bold"
        [class]="layout() === 'grid' ? 'aspect-3/4' : 'h-80'"
        [style.background-color]="tint()"
      >
        @if (image(); as image) {
          <img
            [src]="image.url"
            alt=""
            class="absolute inset-0 size-full object-cover"
            [class.opacity-60]="soldOut()"
            loading="lazy"
          />
        } @else {
          <span aria-hidden="true">{{ 'PRODUCTS.PHOTO' | translate }}</span>
        }
        <span
          class="absolute top-3.5 left-3.5 rounded-pill bg-background px-3 py-1 text-xs font-bold"
          >{{ level }}</span
        >
        @if (soldOut()) {
          <span
            class="absolute right-3.5 bottom-3.5 rounded-pill bg-plum px-3 py-1 text-xs font-bold text-blush"
            aria-hidden="true"
            data-testid="sold-out-badge"
            >{{ soldOutLabel }}</span
          >
        }
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
  /** Shows the "out of stock" badge (and says so in the link's label). */
  readonly soldOut = input(false);
  /** "row": fixed photo height (home page row); "grid": 3:4 photo that follows the column width. */
  readonly layout = input<'row' | 'grid'>('row');

  protected readonly absorbency = computed(() => ABSORBENCY[this.product().absorbency]);
  protected readonly image = computed(() => {
    const product = this.product();
    return productThumbnail(product, product.defaultColor);
  });
}
