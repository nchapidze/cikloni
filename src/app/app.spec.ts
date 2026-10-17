import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { CartService } from './core/cart/cart.service';
import { LanguageService } from './core/i18n/language.service';
import { provideCatalogTesting } from '../testing/catalog-testing';
import { provideTranslateTesting } from '../testing/translate-testing';
import { firstValueFrom } from 'rxjs';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideTranslateTesting(),
        provideCatalogTesting(),
      ],
    }).compileComponents();
    await firstValueFrom(TestBed.inject(LanguageService).init());
  });

  async function render(url: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('wraps pages in the announcement bar, header and footer', async () => {
    const el = await render('/');
    expect(el.querySelector('app-announcement-bar')?.textContent).toContain(
      'შეინარჩუნე სიმშვიდე ქარიშხლიან დღეებშიც',
    );
    expect(el.querySelector('header a[href="/"]')?.textContent).toContain('cikloni');
    expect(el.querySelector('footer')).toBeTruthy();
  });

  it('renders the product route inside the layout', async () => {
    const el = await render('/product/floral-bikini');
    expect(el.querySelector('app-product-page')).toBeTruthy();
    expect(el.querySelector('header')).toBeTruthy();
  });

  it('toggles the mobile menu and switches language', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const menuButton = el.querySelector<HTMLButtonElement>('button[aria-controls="main-nav"]')!;
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('#main-nav')?.classList).toContain('hidden');
    menuButton.click();
    await fixture.whenStable();
    expect(menuButton.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('#main-nav')?.classList).not.toContain('hidden');

    el.querySelector<HTMLButtonElement>('app-language-toggle button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('#main-nav a')?.textContent?.trim()).toBe('Shop');
    expect(document.documentElement.lang).toBe('en');
  });

  it('shows the cart total on the header cart button', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cartButton = () => el.querySelector<HTMLAnchorElement>('[data-testid="cart-button"]')!;
    const badge = () => el.querySelector('[data-testid="cart-count"]');

    expect(badge()).toBeNull();
    expect(cartButton().getAttribute('aria-label')).toBe('კალათა');

    const cart = TestBed.inject(CartService);
    cart.addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' }, 2);
    cart.addItem({ slug: 'colorful-boxer', colorId: 'lilac', size: 'S' });
    await fixture.whenStable();

    expect(badge()?.textContent?.trim()).toBe('3');
    expect(cartButton().getAttribute('aria-label')).toBe('კალათა (3)');
  });

  it('puts the announcement bar inside the banner landmark', async () => {
    const el = await render('/');
    expect(el.querySelectorAll('header')).toHaveLength(1);
    expect(el.querySelector('header app-announcement-bar')).toBeTruthy();
    expect(el.querySelector('header nav#main-nav')).toBeTruthy();
  });

  it('has a skip link that moves focus to the main content', async () => {
    const el = await render('/product/floral-bikini');
    const skip = el.querySelector<HTMLAnchorElement>('a[href="#main"]')!;
    expect(skip.textContent?.trim()).toBe('მთავარ შინაარსზე გადასვლა');
    // First focusable element on the page.
    expect(el.querySelector('a, button')).toBe(skip);

    skip.click();
    expect(document.activeElement).toBe(el.querySelector('main#main'));
    expect(TestBed.inject(Router).url).toBe('/product/floral-bikini');
  });

  it('names the language toggle with its visible text plus the action', async () => {
    const el = await render('/');
    const toggle = el.querySelector('app-language-toggle button')!;
    expect(toggle.hasAttribute('aria-label')).toBe(false);
    expect(toggle.textContent?.replace(/\s+/g, ' ').trim()).toBe('KA / EN Switch to English');
    expect(toggle.querySelector('.sr-only')?.getAttribute('lang')).toBe('en');
  });
});
