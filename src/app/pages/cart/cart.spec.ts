import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { CartService } from '../../core/cart/cart.service';
import { LanguageService } from '../../core/i18n/language.service';
import { CartPage } from './cart';

describe('CartPage', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;
  let cart: CartService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'cart', component: CartPage }]),
        provideTranslateTesting(),
      ],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    cart = TestBed.inject(CartService);
    harness = await RouterTestingHarness.create();
  });

  async function open() {
    await harness.navigateByUrl('/cart', CartPage);
    el = harness.routeNativeElement!;
  }

  const stable = () => harness.fixture.whenStable();
  const lines = () => [...el.querySelectorAll('[data-testid="cart-line"]')];
  const text = (node: Element | null | undefined) => node?.textContent?.replace(/\s+/g, ' ').trim();

  it('shows an empty state with a link to the shop', async () => {
    await open();
    const empty = el.querySelector('[data-testid="cart-empty"]');
    expect(text(empty)).toContain('შენი კალათა ცარიელია');
    expect(empty?.querySelector('a')?.getAttribute('href')).toBe('/#shop');
    expect(el.querySelector('[data-testid="cart-checkout"]')).toBeNull();
  });

  it('lists each line with name, color, size, quantity and price', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' }, 2);
    cart.addItem({ slug: 'colorful-boxer', colorId: 'lilac', size: 'S' });
    await open();

    expect(lines()).toHaveLength(2);
    const first = lines()[0];
    expect(first.querySelector('a')?.getAttribute('href')).toBe('/product/floral-bikini');
    expect(text(first)).toContain('ფერი: ვარდისფერი');
    expect(text(first)).toContain('ზომა: M');
    expect(text(first.querySelector('app-quantity-stepper span'))).toBe('2');
    // Prices are not set yet, so lines and subtotal show the placeholder.
    expect(text(first.querySelector('[data-testid="cart-line-price"]'))).toBe('[ფასი] ₾');
    expect(text(el.querySelector('[data-testid="cart-subtotal"]'))).toBe('[ფასი] ₾');
    expect(el.querySelector('[data-testid="cart-checkout"]')?.getAttribute('href')).toBe(
      '/checkout',
    );
  });

  it('labels each line control with the product variant', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' });
    await open();

    expect(
      lines()[0].querySelector('[data-testid="cart-remove"]')?.getAttribute('aria-label'),
    ).toBe('წაშლა — ყვავილოვანი ბიკინი, ვარდისფერი, M');
  });

  it('changes quantity with the stepper', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' }, 2);
    await open();

    const [minus, plus] = lines()[0].querySelectorAll<HTMLButtonElement>(
      'app-quantity-stepper button',
    );
    plus.click();
    plus.click();
    minus.click();
    await stable();

    expect(cart.totalCount()).toBe(3);
    expect(text(lines()[0].querySelector('app-quantity-stepper span'))).toBe('3');
  });

  it('removes a line, announces it and keeps focus in the cart', async () => {
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' });
    cart.addItem({ slug: 'colorful-boxer', colorId: 'lilac', size: 'S' });
    await open();

    lines()[0].querySelector<HTMLButtonElement>('[data-testid="cart-remove"]')!.click();
    await stable();

    expect(lines()).toHaveLength(1);
    expect(text(el.querySelector('[role="status"]'))).toContain('წაიშალა კალათიდან');
    expect(document.activeElement).toBe(el.querySelector('ul'));

    lines()[0].querySelector<HTMLButtonElement>('[data-testid="cart-remove"]')!.click();
    await stable();

    expect(el.querySelector('[data-testid="cart-empty"]')).toBeTruthy();
    expect(document.activeElement).toBe(el.querySelector('[data-testid="cart-empty"] a'));
  });
});
