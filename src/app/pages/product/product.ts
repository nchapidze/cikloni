import { Component, computed, effect, inject, input, linkedSignal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ChevronDown, LucideAngularModule } from 'lucide-angular';
import { CartService } from '../../core/cart/cart.service';
import { LanguageService } from '../../core/i18n/language.service';
import { LocalizedText, localize } from '../../core/i18n/localized-text';
import { ABSORBENCY, ColorId, Size, productImage } from '../../core/products/product.model';
import { ProductService } from '../../core/products/product.service';
import { AbsorbencyDrops } from '../../shared/absorbency-drops/absorbency-drops';
import { ColorSwatchPicker } from '../../shared/color-swatch-picker/color-swatch-picker';
import { LoadError } from '../../shared/load-error/load-error';
import { LocalizedPipe } from '../../shared/localized/localized.pipe';
import { QuantityStepper } from '../../shared/quantity-stepper/quantity-stepper';
import { SizePicker } from '../../shared/size-picker/size-picker';

/** An accordion section: text from the database, or a translation key for shared copy. */
interface DetailSection {
  title: string;
  text?: LocalizedText;
  textKey?: string;
}

/** Product detail page (design/PRODUCT.md). */
@Component({
  selector: 'app-product-page',
  imports: [
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    AbsorbencyDrops,
    ColorSwatchPicker,
    LoadError,
    LocalizedPipe,
    SizePicker,
    QuantityStepper,
  ],
  templateUrl: './product.html',
})
export class ProductPage {
  protected readonly products = inject(ProductService);
  private readonly cart = inject(CartService);

  /** Bound from the `:slug` route param. */
  readonly slug = input.required<string>();

  protected readonly product = computed(() => this.products.getBySlug(this.slug()));

  // Selection resets to the product's defaults when navigating to another product.
  protected readonly color = linkedSignal<ColorId>(() => this.product()?.defaultColor ?? '');
  protected readonly size = linkedSignal<Size>(() => this.product()?.defaultSize ?? 'M');
  protected readonly quantity = linkedSignal(() => (this.product(), 1));

  protected readonly currentColor = computed(() => {
    const colors = this.product()?.colors ?? [];
    return colors.find((c) => c.id === this.color()) ?? colors[0];
  });
  protected readonly mainImage = computed(() => {
    const product = this.product();
    return product ? productImage(product, this.color()) : undefined;
  });

  /** Accordion sections: the first one is open by default. */
  protected readonly details = computed<DetailSection[]>(() => {
    const product = this.product();
    if (!product) return [];
    const sections: DetailSection[] = [
      { title: 'PRODUCT.DETAILS.DESCRIPTION.TITLE', text: product.description ?? undefined },
      { title: 'PRODUCT.DETAILS.CARE.TITLE', text: product.care ?? undefined },
      { title: 'PRODUCT.DETAILS.DELIVERY.TITLE', textKey: 'PRODUCT.DETAILS.DELIVERY.TEXT' },
    ];
    return sections.filter((section) => section.text || section.textKey);
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
    const language = inject(LanguageService);
    effect(() => {
      const product = this.product();
      if (product) title.setTitle(`${localize(product.name, language.current())} — Cikloni`);
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
