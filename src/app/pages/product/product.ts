import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';
import { CartService } from '../../core/cart/cart.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ABSORBENCY, ColorId, Size } from '../../core/products/product.model';
import { ProductService } from '../../core/products/product.service';
import { AbsorbencyDrops } from '../../shared/absorbency-drops/absorbency-drops';
import { ColorSwatchPicker } from '../../shared/color-swatch-picker/color-swatch-picker';
import { QuantityStepper } from '../../shared/quantity-stepper/quantity-stepper';
import { SizePicker } from '../../shared/size-picker/size-picker';

/** Product detail page (design/PRODUCT.md). */
@Component({
  selector: 'app-product-page',
  imports: [
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    AbsorbencyDrops,
    ColorSwatchPicker,
    SizePicker,
    QuantityStepper,
  ],
  templateUrl: './product.html',
})
export class ProductPage {
  private readonly products = inject(ProductService);
  private readonly cart = inject(CartService);

  /** Bound from the `:slug` route param. */
  readonly slug = input.required<string>();

  protected readonly product = computed(() => this.products.getBySlug(this.slug()));
  protected readonly colors = computed(() => {
    const product = this.product();
    return product ? this.products.getColors(product) : [];
  });

  // Selection resets to the product's defaults when navigating to another product.
  protected readonly color = linkedSignal<ColorId>(() => this.product()?.defaultColor ?? 'coral');
  protected readonly size = linkedSignal<Size>(() => this.product()?.defaultSize ?? 'M');
  protected readonly quantity = linkedSignal(() => (this.product(), 1));

  protected readonly currentColor = computed(() => this.products.getColor(this.color()));

  /** Accordion sections: description open by default. */
  protected readonly details = computed(() => {
    const product = this.product();
    if (!product) return [];
    return [
      { title: 'PRODUCT.DETAILS.DESCRIPTION.TITLE', text: product.descriptionKey },
      { title: 'PRODUCT.DETAILS.CARE.TITLE', text: product.careKey },
      { title: 'PRODUCT.DETAILS.DELIVERY.TITLE', text: 'PRODUCT.DETAILS.DELIVERY.TEXT' },
    ];
  });

  private readonly selectionKey = computed(
    () => `${this.slug()}:${this.color()}:${this.size()}:${this.quantity()}`,
  );
  private readonly lastAdded = linkedSignal<string | null>(() => (this.product(), null));
  /** True until the selection changes after adding. */
  protected readonly added = computed(() => this.lastAdded() === this.selectionKey());

  protected readonly absorbency = ABSORBENCY;
  protected readonly chevron = ChevronDown;

  constructor() {
    const title = inject(Title);
    const translate = inject(TranslateService);
    const language = inject(LanguageService);
    effect(() => {
      language.current();
      const product = this.product();
      if (product) title.setTitle(`${translate.instant(product.nameKey)} — Cikloni`);
    });
  }

  protected addToCart(): void {
    const product = this.product();
    if (!product) return;
    this.cart.addItem(
      { slug: product.slug, colorId: this.color(), size: this.size() },
      this.quantity(),
    );
    this.lastAdded.set(this.selectionKey());
  }
}
