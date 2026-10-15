import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { CartService } from '../../core/cart/cart.service';
import { LanguageService } from '../../core/i18n/language.service';
import { ProductPage } from './product';

describe('ProductPage', () => {
  let harness: RouterTestingHarness;
  let el: HTMLElement;

  async function open(slug: string) {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'product/:slug', component: ProductPage }],
          withComponentInputBinding(),
        ),
        provideTranslateTesting(),
      ],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/product/${slug}`, ProductPage);
    el = harness.routeNativeElement!;
  }

  const text = (selector: string) =>
    el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const pressed = (selector: string) =>
    [...el.querySelectorAll(`${selector} button[aria-pressed="true"]`)].map(
      (b) => b.getAttribute('aria-label') ?? b.textContent?.trim(),
    );
  const click = async (button: Element | null | undefined) => {
    (button as HTMLButtonElement).click();
    await harness.fixture.whenStable();
  };

  it('renders the product loaded by slug', async () => {
    await open('floral-bikini');
    expect(text('h1')).toBe('ყვავილოვანი ბიკინი');
    const crumbs = [...el.querySelectorAll('nav ol > li')].map((li) =>
      li.textContent?.replace('/', '').trim(),
    );
    expect(crumbs).toEqual(['მთავარი', 'მაღაზია', 'ყვავილოვანი ბიკინი']);
    expect(el.querySelector('nav ol a[fragment], nav ol a[href="/#shop"]')).toBeTruthy();
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe(
      'ყვავილოვანი ბიკინი',
    );
    expect(el.textContent).toContain('ბესტსელერი');
    expect(el.textContent).toContain('[ფასი] ₾');
    expect(TestBed.inject(Title).getTitle()).toBe('ყვავილოვანი ბიკინი — Cikloni');
  });

  it('shows the absorbency box for the product level', async () => {
    await open('floral-bikini');
    const box = el.querySelector('app-absorbency-drops')!.parentElement!;
    expect(box.querySelectorAll('[data-filled="true"]')).toHaveLength(2);
    expect(box.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'შთანთქმა: საშუალო — ჩვეულებრივი დღეებისთვის',
    );
  });

  it('uses the light note for a light product', async () => {
    await open('seamless-hipster');
    const box = el.querySelector('app-absorbency-drops')!.parentElement!;
    expect(box.querySelectorAll('[data-filled="true"]')).toHaveLength(1);
    expect(box.textContent).toContain('ციკლის დასაწყისი და ბოლო დღეებისთვის');
  });

  it('changes the main image background with the selected color', async () => {
    await open('floral-bikini');
    const image = () => el.querySelector<HTMLElement>('[data-testid="main-image"]')!;

    expect(el.querySelectorAll('app-color-swatch-picker button')).toHaveLength(4);
    expect(pressed('app-color-swatch-picker')).toEqual(['ვარდისფერი']);
    expect(text('app-color-swatch-picker legend')).toBe('ფერი: ვარდისფერი');
    expect(image().style.backgroundColor).toBe('var(--color-coral-soft)');

    await click(el.querySelector('app-color-swatch-picker button[aria-label="იასამნისფერი"]'));

    expect(pressed('app-color-swatch-picker')).toEqual(['იასამნისფერი']);
    expect(text('app-color-swatch-picker legend')).toBe('ფერი: იასამნისფერი');
    expect(image().style.backgroundColor).toBe('var(--color-lilac)');
    expect(image().textContent).toContain('პროდუქტის ფოტო — იასამნისფერი');
  });

  it('selects sizes XS-XXL with M as the default', async () => {
    await open('floral-bikini');
    const sizes = [...el.querySelectorAll('app-size-picker button')].map((b) =>
      b.textContent?.trim(),
    );
    expect(sizes).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
    expect(pressed('app-size-picker')).toEqual(['M']);

    await click(el.querySelectorAll('app-size-picker button')[3]);
    expect(pressed('app-size-picker')).toEqual(['L']);
  });

  it('clamps the quantity between 1 and 10', async () => {
    await open('floral-bikini');
    const [dec, inc] = el.querySelectorAll<HTMLButtonElement>('app-quantity-stepper button');
    const value = () => text('app-quantity-stepper [aria-live]');

    expect(value()).toBe('1');
    expect(dec.getAttribute('aria-disabled')).toBe('true');
    expect(dec.disabled).toBe(false); // stays focusable

    for (let i = 0; i < 12; i++) await click(inc);
    expect(value()).toBe('10');
    expect(inc.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement === inc || !inc.disabled).toBe(true);

    await click(dec);
    expect(value()).toBe('9');
  });

  it('adds the selection to the cart and confirms on the button', async () => {
    await open('floral-bikini');
    const cart = TestBed.inject(CartService);
    const button = () => el.querySelector('[data-testid="add-to-cart"]')!;
    const status = () => text('[role="status"]');

    expect(button().textContent?.trim()).toBe('კალათაში დამატება');

    await click(el.querySelectorAll('app-quantity-stepper button')[1]); // qty 2
    await click(el.querySelector('app-color-swatch-picker button[aria-label="პიტნისფერი"]'));
    await click(button());

    expect(cart.totalCount()).toBe(2);
    expect(cart.items()[0]).toMatchObject({
      slug: 'floral-bikini',
      colorId: 'mint',
      size: 'M',
      quantity: 2,
    });
    expect(button().textContent?.trim()).toBe('დამატებულია კალათაში ✓');
    expect(status()).toBe('დამატებულია კალათაში ✓');

    // Changing the selection resets the label so the next add is clear.
    await click(el.querySelectorAll('app-size-picker button')[4]);
    expect(button().textContent?.trim()).toBe('კალათაში დამატება');
  });

  it('renders trust chips and the details accordion with description open', async () => {
    await open('floral-bikini');
    expect(
      [...el.querySelectorAll('ul li.rounded-pill')].map((li) => li.textContent?.trim()),
    ).toEqual(['დისკრეტული შეფუთვა', 'მრავალჯერადი', 'საფენის გარეშე']);

    const details = [...el.querySelectorAll<HTMLDetailsElement>('details')];
    expect(details.map((d) => d.querySelector('summary')?.textContent?.trim())).toEqual([
      'აღწერა',
      'მოვლა',
      'მიწოდება და დაბრუნება',
    ]);
    expect(details.map((d) => d.open)).toEqual([true, false, false]);
    expect(details[0].textContent).toContain('ფერადი ყვავილოვანი ბიკინი');
  });

  it('shows a not-found message for an unknown slug', async () => {
    await open('does-not-exist');
    expect(text('h1')).toBe('პროდუქტი ვერ მოიძებნა');
    expect(el.querySelector('a[href="/"]')?.textContent?.trim()).toBe('მთავარ გვერდზე დაბრუნება');
  });
});
