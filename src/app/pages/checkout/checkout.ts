import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { CircleAlert, LucideAngularModule } from 'lucide-angular';
import {
  DELIVERY_METHODS,
  DELIVERY_METHOD_IDS,
  DeliveryMethodId,
  FIELD_MAX_LENGTH,
  PAYMENT_METHOD_IDS,
  PaymentMethodId,
  normalizeGeorgianPhone,
} from '../../core/checkout/checkout.config';
import { CheckoutService } from '../../core/checkout/checkout.service';
import { CreateOrderError, CreateOrderFailure } from '../../core/data-access/orders.api';
import { ProductService } from '../../core/products/product.service';
import { LoadError } from '../../shared/load-error/load-error';
import { LocalizedPipe } from '../../shared/localized/localized.pipe';
import { OrderSummary, OrderSummaryLine } from '../../shared/order-summary/order-summary';
import { PricePipe } from '../../shared/price/price.pipe';
import { TextField } from '../../shared/text-field/text-field';

/** Validators.required lets whitespace through; the server would reject it. */
function requiredText(control: AbstractControl<string>): ValidationErrors | null {
  return control.value.trim() ? null : { required: true };
}

function georgianPhone(control: AbstractControl<string>): ValidationErrors | null {
  if (!control.value.trim()) return { required: true };
  return normalizeGeorgianPhone(control.value) ? null : { phone: true };
}

/** City is only asked for (and required) when the delivery method has no fixed city. */
function cityForDelivery(control: AbstractControl<string>): ValidationErrors | null {
  const method = control.parent?.get('deliveryMethod')?.value as DeliveryMethodId | undefined;
  if (!method || DELIVERY_METHODS[method].fixedCity) return null;
  return requiredText(control);
}

const text = (validators = [requiredText], max?: number) =>
  new FormControl('', {
    nonNullable: true,
    validators: max ? [...validators, Validators.maxLength(max)] : validators,
  });

/** Guest checkout: contact, delivery and payment details, with the order summary beside. */
@Component({
  selector: 'app-checkout-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslatePipe,
    LucideAngularModule,
    LoadError,
    LocalizedPipe,
    OrderSummary,
    PricePipe,
    TextField,
  ],
  templateUrl: './checkout.html',
})
export class CheckoutPage {
  private readonly checkout = inject(CheckoutService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly products = inject(ProductService);

  protected readonly maxLength = FIELD_MAX_LENGTH;
  protected readonly alertIcon = CircleAlert;
  protected readonly deliveryOptions = DELIVERY_METHOD_IDS.map((id) => ({
    id,
    feeGel: DELIVERY_METHODS[id].feeGel,
    key: `CHECKOUT.DELIVERY.METHODS.${id.toUpperCase()}`,
  }));
  protected readonly paymentOptions = PAYMENT_METHOD_IDS.map((id) => ({
    id,
    key: `CHECKOUT.PAYMENT.METHODS.${id.toUpperCase()}`,
  }));

  protected readonly form = new FormGroup({
    name: text([requiredText], FIELD_MAX_LENGTH.name),
    phone: text([georgianPhone]),
    email: text([Validators.email], FIELD_MAX_LENGTH.email),
    deliveryMethod: new FormControl<DeliveryMethodId>('tbilisi', { nonNullable: true }),
    city: text([cityForDelivery], FIELD_MAX_LENGTH.city),
    address: text([requiredText], FIELD_MAX_LENGTH.address),
    notes: text([], FIELD_MAX_LENGTH.notes),
    paymentMethod: new FormControl<PaymentMethodId>('cash', { nonNullable: true }),
  });

  protected readonly deliveryMethod = toSignal(this.form.controls.deliveryMethod.valueChanges, {
    initialValue: this.form.controls.deliveryMethod.value,
  });
  protected readonly needsCity = computed(() => !DELIVERY_METHODS[this.deliveryMethod()].fixedCity);
  protected readonly selectedDelivery = computed(() =>
    this.deliveryOptions.find((option) => option.id === this.deliveryMethod())!,
  );

  /** A submit was attempted: show every invalid field, touched or not. */
  protected readonly submitted = signal(false);
  protected readonly sending = signal(false);
  protected readonly failure = signal<CreateOrderFailure | null>(null);

  /** The cart can only be shown once the catalog has loaded. */
  protected readonly waiting = computed(
    () => this.products.status() !== 'ready' && !this.sending(),
  );
  protected readonly lines = this.checkout.lines;
  protected readonly summaryLines = computed<OrderSummaryLine[]>(() =>
    this.lines().map((line) => ({
      id: line.item.id,
      name: line.product.name,
      color: line.color.name,
      size: line.item.size,
      quantity: line.item.quantity,
      unitPriceGel: line.product.price,
      tint: line.color.soft,
      imageUrl: line.imageUrl,
    })),
  );

  /** Out-of-stock lines from the last attempt, described for the error message. */
  protected readonly stockProblems = computed(() => {
    const failure = this.failure();
    if (failure?.error !== 'OUT_OF_STOCK') return [];
    return failure.items.flatMap((problem) => {
      const line = this.lines().find((l) => l.variantId === problem.variantId);
      return line ? [{ line, available: problem.available }] : [];
    });
  });

  constructor() {
    // Re-check the city when the delivery method changes (it is required only for regions).
    this.form.controls.deliveryMethod.valueChanges.subscribe(() =>
      this.form.controls.city.updateValueAndValidity(),
    );
  }

  protected async submit(): Promise<void> {
    if (this.sending()) return;
    this.failure.set(null);
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focus('[aria-invalid="true"]');
      return;
    }

    this.sending.set(true);
    try {
      const result = await this.checkout.placeOrder(this.form.getRawValue());
      if (result.payment.type === 'redirect') {
        window.location.assign(result.payment.url);
        return;
      }
      await this.router.navigate(['/order', result.orderNumber]);
    } catch (error) {
      this.sending.set(false);
      this.failure.set(error instanceof CreateOrderError ? error.failure : { error: 'NETWORK' });
      this.focus('[data-testid="checkout-error"]');
    }
  }

  /** Lowers the cart to what is in stock, so the next attempt can succeed. */
  protected fixCart(): void {
    const failure = this.failure();
    if (failure?.error === 'OUT_OF_STOCK') this.checkout.applyStock(failure.items);
    this.failure.set(null);
  }

  private focus(selector: string): void {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus(), {
      injector: this.injector,
    });
  }
}
