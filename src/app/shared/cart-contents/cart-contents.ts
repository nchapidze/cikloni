import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { CartItem, CartService, MAX_LINE_QUANTITY } from '../../core/cart/cart.service';
import { LocalizedText } from '../../core/i18n/localized-text';
import {
  Product,
  ProductColor,
  ProductImage,
  productImage,
} from '../../core/products/product.model';
import { ProductService } from '../../core/products/product.service';
import { LoadError } from '../load-error/load-error';
import { LocalizedPipe } from '../localized/localized.pipe';
import { QuantityStepper } from '../quantity-stepper/quantity-stepper';

interface CartLine {
  item: CartItem;
  product: Product;
  color: ProductColor;
  image: ProductImage | undefined;
  /** Null until the product has a price. */
  lineTotal: number | null;
}

/**
 * Cart lines, subtotal and checkout link, or an empty state. Shared by the cart drawer and the
 * /cart page. Prices shown here are for display only; the server recalculates them on checkout.
 */
@Component({
  selector: 'app-cart-contents',
  imports: [
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    LoadError,
    LocalizedPipe,
    QuantityStepper,
  ],
  host: {
    class: 'flex min-h-0 flex-col',
  },
  templateUrl: './cart-contents.html',
})
export class CartContents {
  private readonly cart = inject(CartService);
  protected readonly products = inject(ProductService);
  private readonly injector = inject(Injector);

  /** Drawer: scrolling list with the summary pinned below. Page: list and summary side by side. */
  readonly layout = input<'drawer' | 'page'>('page');

  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly shopLink = viewChild<ElementRef<HTMLElement>>('shopLink');

  /** Lines can only be shown once the catalog has loaded (names, colors and prices). */
  protected readonly waiting = computed(
    () => this.cart.items().length > 0 && this.products.status() !== 'ready',
  );

  protected readonly lines = computed<CartLine[]>(() =>
    this.cart.items().flatMap((item) => {
      const product = this.products.getBySlug(item.slug);
      const color = product?.colors.find((c) => c.id === item.colorId);
      if (!product || !color) return [];
      const lineTotal = product.price === null ? null : product.price * item.quantity;
      const image = productImage(product, item.colorId);
      return [{ item, product, color, image, lineTotal }];
    }),
  );

  /** Null while any line has no price yet (renders the price placeholder). */
  protected readonly subtotal = computed(() =>
    this.lines().reduce<number | null>(
      (sum, line) => (sum === null || line.lineTotal === null ? null : sum + line.lineTotal),
      0,
    ),
  );

  /** Description of the last removed line, announced to screen readers. */
  protected readonly removed = signal<{
    name: LocalizedText;
    color: LocalizedText;
    size: string;
  } | null>(null);

  protected readonly maxQuantity = MAX_LINE_QUANTITY;
  protected readonly trash = Trash2;

  protected setQuantity(item: CartItem, quantity: number): void {
    this.removed.set(null);
    this.cart.updateQuantity(item.id, quantity);
  }

  protected remove(line: CartLine): void {
    this.removed.set({
      name: line.product.name,
      color: line.color.name,
      size: line.item.size,
    });
    this.cart.removeItem(line.item.id);
    // The focused remove button is gone: keep focus inside the cart.
    afterNextRender(() => (this.list() ?? this.shopLink())?.nativeElement.focus(), {
      injector: this.injector,
    });
  }
}
