import { Injectable, computed, inject } from '@angular/core';
import { CartItem, CartService } from '../cart/cart.service';
import {
  CreateOrderResult,
  DeliveryMethodId,
  findVariant,
  OrdersApi,
  PaymentMethodId,
  Product,
  ProductColor,
  productThumbnail,
  StockProblem,
} from '@cikloni/shared';
import { ProductService } from '../products/product.service';
import { OrderConfirmations } from './order-confirmations';

export interface CheckoutLine {
  item: CartItem;
  product: Product;
  color: ProductColor;
  variantId: string;
  imageUrl: string | undefined;
}

export interface CheckoutDetails {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  notes: string;
  deliveryMethod: DeliveryMethodId;
  paymentMethod: PaymentMethodId;
}

/** Turns the cart into an order. The server recalculates prices, fees and stock. */
@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cart = inject(CartService);
  private readonly products = inject(ProductService);
  private readonly api = inject(OrdersApi);
  private readonly confirmations = inject(OrderConfirmations);

  /** Cart lines resolved to catalog variants (empty until the catalog has loaded). */
  readonly lines = computed<CheckoutLine[]>(() =>
    this.cart.items().flatMap((item) => {
      const product = this.products.getBySlug(item.slug);
      const color = product?.colors.find((c) => c.id === item.colorId);
      const variant = product && findVariant(product, item.colorId, item.size);
      if (!product || !color || !variant) return [];
      const imageUrl = productThumbnail(product, item.colorId)?.url;
      return [{ item, product, color, variantId: variant.id, imageUrl }];
    }),
  );

  /** Creates the order, then empties the cart. Throws CreateOrderError on failure. */
  async placeOrder(details: CheckoutDetails): Promise<CreateOrderResult> {
    const lines = this.lines();
    const result = await this.api.createOrder({
      items: lines.map((line) => ({
        variantId: line.variantId,
        quantity: line.item.quantity,
      })),
      customer: {
        name: details.name,
        phone: details.phone,
        email: details.email || undefined,
        city: details.city || undefined,
        address: details.address,
        notes: details.notes || undefined,
      },
      deliveryMethod: details.deliveryMethod,
      paymentMethod: details.paymentMethod,
    });
    this.confirmations.save({
      ...result,
      customer: { name: details.name, phone: details.phone, address: details.address },
      thumbnails: result.items.map((item) => {
        // The server returns names and size, not variant ids; within one order they are unique.
        const line = lines.find(
          (l) =>
            l.product.name.ka === item.productName.ka &&
            l.color.name.ka === item.colorName.ka &&
            l.item.size === item.size,
        );
        return line ? { tint: line.color.soft, imageUrl: line.imageUrl } : null;
      }),
    });
    this.cart.clear();
    return result;
  }

  /** Lowers cart quantities to what is in stock; lines with nothing left are removed. */
  applyStock(problems: readonly StockProblem[]): void {
    for (const problem of problems) {
      const line = this.lines().find((l) => l.variantId === problem.variantId);
      if (line) this.cart.updateQuantity(line.item.id, problem.available);
    }
  }
}
