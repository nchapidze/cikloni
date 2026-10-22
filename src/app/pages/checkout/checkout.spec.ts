import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { mapRows, provideCatalogTesting, SEED_ROWS, variantId } from '@cikloni/shared/testing';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { CartService } from '../../core/cart/cart.service';
import { CreateOrderError, CreateOrderResult, OrdersApi } from '@cikloni/shared';
import { LanguageService } from '../../core/i18n/language.service';
import { OrderPage } from '../order/order';
import { CheckoutPage } from './checkout';

describe('CheckoutPage', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  let cart: CartService;
  let createOrder: ReturnType<typeof vi.fn>;

  const result: CreateOrderResult = {
    orderNumber: 'CK-001001',
    items: [
      {
        productName: { ka: 'ყვავილოვანი ბიკინი', en: 'Floral bikini' },
        colorName: { ka: 'ვარდისფერი', en: 'Pink' },
        size: 'M',
        unitPriceGel: 39.9,
        quantity: 2,
      },
    ],
    subtotalGel: 79.8,
    deliveryFeeGel: 5,
    totalGel: 84.8,
    city: 'თბილისი',
    deliveryMethod: 'tbilisi',
    paymentMethod: 'cash',
    payment: { type: 'none' },
  };

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    createOrder = vi.fn().mockResolvedValue(result);
    // Priced catalog, so the summary shows real amounts.
    const priced = SEED_ROWS.map((row) => ({ ...row, price_gel: 39.9 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: 'checkout', component: CheckoutPage },
            { path: 'order/:orderNumber', component: OrderPage },
          ],
          withComponentInputBinding(),
        ),
        provideTranslateTesting(),
        provideCatalogTesting(async () => mapRows(priced)),
        { provide: OrdersApi, useValue: { createOrder } },
      ],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    cart = TestBed.inject(CartService);
    harness = await RouterTestingHarness.create();
  });

  async function open() {
    await harness.navigateByUrl('/checkout');
    await stable();
    el = harness.routeNativeElement!;
  }

  const stable = () => harness.fixture.whenStable();
  const text = (node: Element | null | undefined) => node?.textContent?.replace(/\s+/g, ' ').trim();
  const field = (id: string) =>
    el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#checkout-${id}`)!;
  const errorOf = (id: string) => text(el.querySelector(`#checkout-${id}-error`));

  async function type(id: string, value: string) {
    const input = field(id);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await stable();
  }

  async function chooseDelivery(method: 'tbilisi' | 'regions') {
    const radios = el.querySelectorAll<HTMLInputElement>('input[name="deliveryMethod"]');
    radios[method === 'tbilisi' ? 0 : 1].click();
    await stable();
  }

  async function fillValid() {
    await type('name', 'ნინო ჩაფიძე');
    await type('phone', '555 12 34 56');
    await type('address', 'ვაჟა-ფშაველას 1');
  }

  async function submit() {
    el.querySelector<HTMLButtonElement>('[data-testid="checkout-submit"]')!.click();
    await stable();
  }

  it('shows an empty state when the cart is empty', async () => {
    await open();
    expect(text(el.querySelector('[data-testid="checkout-empty"]'))).toContain('კალათა ცარიელია');
    expect(el.querySelector('form')).toBeNull();
  });

  it('summarises the cart with the delivery fee for the chosen method', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' }, 3);
    await open();

    const summary = el.querySelector('app-order-summary')!;
    expect(summary.querySelectorAll('[data-testid="summary-line"]')).toHaveLength(1);
    expect(text(summary.querySelector('[data-testid="summary-line"]'))).toContain(
      'ვარდისფერი · M · × 3',
    );
    // 3 × 39.90 sums exactly, in Georgian number format.
    expect(text(summary.querySelector('[data-testid="summary-subtotal"]'))).toBe('119,70 ₾');
    expect(text(summary.querySelector('[data-testid="summary-total"]'))).toBe('124,70 ₾');

    await chooseDelivery('regions');
    expect(text(summary.querySelector('[data-testid="summary-delivery"]'))).toBe('10 ₾');
    expect(text(summary.querySelector('[data-testid="summary-total"]'))).toBe('129,70 ₾');
  });

  it('asks for a city only for regional delivery', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' });
    await open();
    expect(el.querySelector('#checkout-city')).toBeNull();

    await chooseDelivery('regions');
    expect(field('city')).toBeTruthy();
    expect(text(el.querySelector('label[for="checkout-city"]'))).toBe('ქალაქი ან სოფელი');
  });

  it('flags invalid fields on submit and focuses the first one', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' });
    await open();
    await chooseDelivery('regions');
    await type('phone', '123');
    await type('email', 'not-an-email');
    await submit();

    expect(createOrder).not.toHaveBeenCalled();
    expect(errorOf('name')).toBe('შეავსე ეს ველი.');
    expect(errorOf('phone')).toBe('შეიყვანე ქართული მობილურის ნომერი, მაგ.: 555 12 34 56.');
    expect(errorOf('email')).toBe('შეიყვანე სწორი ელფოსტა.');
    expect(errorOf('city')).toBe('შეავსე ეს ველი.');
    expect(errorOf('address')).toBe('შეავსე ეს ველი.');
    expect(errorOf('notes')).toBeUndefined();
    expect(field('phone').getAttribute('aria-describedby')).toBe(
      'checkout-phone-hint checkout-phone-error',
    );
    expect(document.activeElement).toBe(field('name'));
  });

  it('sends only variant ids and quantities, then shows the confirmation', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' }, 2);
    cart.addItem({ slug: 'colorful-boxer', colorId: 'lilac', size: 'S' });
    await open();
    await fillValid();
    await type('notes', 'დარეკე მოსვლამდე');
    await submit();

    expect(createOrder).toHaveBeenCalledWith({
      items: [
        { variantId: variantId('floral-bikini', 'coral', 'M'), quantity: 2 },
        { variantId: variantId('colorful-boxer', 'lilac', 'S'), quantity: 1 },
      ],
      customer: {
        name: 'ნინო ჩაფიძე',
        phone: '555 12 34 56',
        email: undefined,
        city: undefined,
        address: 'ვაჟა-ფშაველას 1',
        notes: 'დარეკე მოსვლამდე',
      },
      deliveryMethod: 'tbilisi',
      paymentMethod: 'cash',
      language: 'ka',
    });
    expect(cart.items()).toEqual([]);
    expect(TestBed.inject(Router).url).toBe('/order/CK-001001');

    const order = harness.routeNativeElement!;
    expect(text(order.querySelector('h1'))).toBe('მადლობა შეკვეთისთვის!');
    expect(text(order.querySelector('[data-testid="order-number"]'))).toBe('CK-001001');
    // Server amounts, not the catalog preview.
    expect(text(order.querySelector('[data-testid="summary-total"]'))).toBe('84,80 ₾');
    // Thumbnails come from the cart lines (the server result has none).
    const thumbnails = [
      ...order.querySelectorAll<HTMLElement>('[data-testid="summary-line"] > div[aria-hidden]'),
    ];
    expect(thumbnails.map((t) => t.style.backgroundColor)).toEqual(['var(--color-coral-soft)']);
    expect(text(order.querySelector('[data-testid="order-delivery"]'))).toContain(
      'თბილისი, ვაჟა-ფშაველას 1',
    );
    expect(text(order.querySelector('[data-testid="order-next"]'))).toContain(
      'კურიერი შეკვეთას 1–2 სამუშაო დღეში მოგიტანს.',
    );
  });

  it('explains what is out of stock and can lower the cart to match', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' }, 5);
    cart.addItem({ slug: 'colorful-boxer', colorId: 'lilac', size: 'S' });
    createOrder.mockRejectedValueOnce(
      new CreateOrderError({
        error: 'OUT_OF_STOCK',
        items: [
          { variantId: variantId('floral-bikini', 'coral', 'M'), available: 2 },
          { variantId: variantId('colorful-boxer', 'lilac', 'S'), available: 0 },
        ],
      }),
    );
    await open();
    await fillValid();
    await submit();

    const alert = el.querySelector('[data-testid="checkout-error"]')!;
    expect(document.activeElement).toBe(alert);
    expect(text(alert)).toContain('ყვავილოვანი ბიკინი, ვარდისფერი, M — მარაგშია 2 ცალი');
    expect(text(alert)).toContain('ფერადი ბოქსერი, იასამნისფერი, S — ამჟამად მიუწვდომელია');
    expect(TestBed.inject(Router).url).toBe('/checkout');

    alert.querySelector('button')!.click();
    await stable();

    expect(cart.items().map((i) => [i.slug, i.quantity])).toEqual([['floral-bikini', 2]]);
    expect(el.querySelector('[data-testid="checkout-error"]')).toBeNull();
  });

  it('shows a retryable message when the server cannot be reached', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' });
    createOrder.mockRejectedValueOnce(new CreateOrderError({ error: 'NETWORK' }));
    await open();
    await fillValid();
    await submit();

    expect(text(el.querySelector('[data-testid="checkout-error"]'))).toContain(
      'ვერ დავუკავშირდით სერვერს.',
    );
    expect(cart.totalCount()).toBe(1);

    await submit();
    expect(createOrder).toHaveBeenCalledTimes(2);
    expect(TestBed.inject(Router).url).toBe('/order/CK-001001');
  });
});
