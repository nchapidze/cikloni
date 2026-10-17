import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { Product } from '@cikloni/shared';
import { SEED_ROWS, mapRows, provideCatalogTesting } from '@cikloni/shared/testing';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { LanguageService } from '../../core/i18n/language.service';
import { ShopPage } from './shop';

/** The seed catalog, with the floral bikini sold out and prices to sort by. */
function catalog(): Product[] {
  const [bikini, hipster, boxer, brazilian] = mapRows(SEED_ROWS);
  return [
    { ...bikini, price: 45, variants: bikini.variants.map((v) => ({ ...v, stock: 0 })) },
    { ...hipster, price: 35 },
    { ...boxer, price: 49 },
    { ...brazilian, price: 39 },
  ];
}

async function render(url = '/shop', listProducts = async () => catalog()) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'shop', component: ShopPage }], withComponentInputBinding()),
      provideTranslateTesting(),
      provideCatalogTesting(listProducts),
    ],
  });
  await firstValueFrom(TestBed.inject(LanguageService).init());
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, ShopPage);
  await harness.fixture.whenStable();
  const el = harness.routeNativeElement!;
  const router = TestBed.inject(Router);

  const names = () =>
    [...el.querySelectorAll('ul[aria-label] app-product-card h3')].map((h) =>
      h.textContent!.trim(),
    );
  const count = () => el.querySelector('[data-testid="result-count"]')!.textContent!.trim();
  const settle = async () => {
    await harness.fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));
    await harness.fixture.whenStable();
  };
  const sidebar = () => el.querySelector('aside')!;
  const check = async (label: string) => {
    const option = [...sidebar().querySelectorAll('label')].find(
      (l) => l.textContent!.trim() === label,
    )!;
    option.querySelector('input')!.click();
    await settle();
  };
  return { harness, el, router, names, count, settle, sidebar, check };
}

describe('ShopPage', () => {
  it('shows the title, the result count and every product, sold out last with a badge', async () => {
    const { el, names, count } = await render();

    expect(el.querySelector('h1')!.textContent).toContain('მაღაზია');
    expect(count()).toBe('4 პროდუქტი');
    expect(names()).toEqual([
      'უნაკერო ჰიპსტერი',
      'ფერადი ბოქსერი',
      'მაქმანიანი ბრაზილიანა',
      'ყვავილოვანი ბიკინი',
    ]);
    const cards = [...el.querySelectorAll('app-product-card')];
    expect(cards[3].querySelector('[data-testid="sold-out-badge"]')!.textContent).toContain(
      'მარაგში არ არის',
    );
    expect(cards[0].querySelector('[data-testid="sold-out-badge"]')).toBeNull();
    expect(cards[3].querySelector('a')!.getAttribute('aria-label')).toContain('მარაგში არ არის');
  });

  it('reads filters and sorting from the URL', async () => {
    const { names, count, el } = await render('/shop?absorbency=light&sort=price-asc');

    expect(names()).toEqual(['უნაკერო ჰიპსტერი', 'მაქმანიანი ბრაზილიანა']);
    expect(count()).toBe('2 პროდუქტი');
    expect(el.querySelector<HTMLSelectElement>('select')!.value).toBe('price-asc');
  });

  it('writes filter changes to the URL, so the view can be shared', async () => {
    const { router, check, names } = await render();

    await check('ბოქსერი');
    expect(router.url).toBe('/shop?style=boxer');
    expect(names()).toEqual(['ფერადი ბოქსერი']);

    await check('ძლიერი');
    expect(router.url).toBe('/shop?style=boxer&absorbency=heavy');
  });

  it('sorts from the select', async () => {
    const { el, router, names, settle } = await render();
    const select = el.querySelector<HTMLSelectElement>('select')!;

    select.value = 'price-desc';
    select.dispatchEvent(new Event('change'));
    await settle();

    expect(router.url).toBe('/shop?sort=price-desc');
    expect(names()).toEqual([
      'ფერადი ბოქსერი',
      'მაქმანიანი ბრაზილიანა',
      'უნაკერო ჰიპსტერი',
      'ყვავილოვანი ბიკინი',
    ]);
  });

  it('offers only sizes in stock and the colors the catalog has', async () => {
    const products = catalog().map((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.size === 'XXL' ? { ...v, stock: 0 } : v)),
    }));
    const { sidebar } = await render('/shop', async () => products);

    const sizes = [...sidebar().querySelectorAll('fieldset')[2].querySelectorAll('label')].map(
      (l) => l.textContent!.trim(),
    );
    expect(sizes).toEqual(['XS', 'S', 'M', 'L', 'XL']);
    const colors = [...sidebar().querySelectorAll('fieldset')[3].querySelectorAll('label')].map(
      (l) => l.getAttribute('title'),
    );
    expect(colors).toEqual(['ვარდისფერი', 'იასამნისფერი', 'ნარინჯისფერი', 'პიტნისფერი']);
  });

  it('shows an empty state that clears the filters but keeps the sort', async () => {
    const { el, router, settle, names } = await render('/shop?style=high_waist&sort=newest');

    const empty = el.querySelector('[data-testid="no-results"]')!;
    expect(empty.textContent).toContain('ასეთი პროდუქტი ვერ მოიძებნა');

    empty.querySelector('button')!.click();
    await settle();

    expect(router.url).toBe('/shop?sort=newest');
    expect(names()).toHaveLength(4);
  });

  it('shows skeletons while loading', async () => {
    // The catalog never loads, so the app never becomes stable: render without waiting for it.
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'shop', component: ShopPage }], withComponentInputBinding()),
        provideTranslateTesting(),
        provideCatalogTesting(() => new Promise(() => undefined)),
      ],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    const harness = await RouterTestingHarness.create();
    void harness.navigateByUrl('/shop');
    await new Promise((resolve) => setTimeout(resolve));
    harness.detectChanges();
    const el = harness.routeNativeElement!;

    expect(el.querySelectorAll('[data-testid="product-skeleton"]')).toHaveLength(8);
    expect(el.querySelector('[data-testid="result-count"]')!.textContent!.trim()).toBe('');
  });

  it('opens the filters in a bottom sheet with live "show results" and "clear all"', async () => {
    const { el, router, settle } = await render('/shop?absorbency=light');
    const open = [...el.querySelectorAll('button')].find((b) =>
      b.textContent!.includes('ფილტრები'),
    )!;
    expect(open.textContent).toContain('ფილტრები (1)');

    open.click();
    await settle();
    const sheet = document.querySelector<HTMLElement>('.cdk-overlay-container app-filter-sheet')!;
    const button = (text: string) =>
      [...sheet.querySelectorAll('button')].find((b) => b.textContent!.includes(text))!;
    expect(button('ნახვა').textContent).toContain('2 პროდუქტის ნახვა');

    button('ყველაფრის გასუფთავება').click();
    await settle();
    expect(router.url).toBe('/shop');
    expect(button('ნახვა').textContent).toContain('4 პროდუქტის ნახვა');

    button('ნახვა').click();
    await settle();
    expect(document.querySelector('app-filter-sheet')).toBeNull();
  });
});
