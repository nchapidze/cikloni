import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideCatalogTesting } from '@cikloni/shared/testing';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { App } from '../../app';
import { routes } from '../../app.routes';
import { CartService } from '../../core/cart/cart.service';
import { LanguageService } from '../../core/i18n/language.service';

describe('Cart drawer', () => {
  let wide: boolean;

  beforeEach(async () => {
    localStorage.clear();
    wide = true;
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: wide, media: query }));
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

  afterEach(() => vi.unstubAllGlobals());

  async function render() {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const button = el.querySelector<HTMLAnchorElement>('[data-testid="cart-button"]')!;
    return { fixture, button };
  }

  const drawer = () =>
    document.querySelector<HTMLElement>('.cdk-overlay-container app-cart-drawer');
  const dialog = () =>
    document.querySelector<HTMLElement>('.cdk-overlay-container [role="dialog"]');

  it('opens from the header cart button as a labelled modal dialog', async () => {
    TestBed.inject(CartService).addItem({ slug: 'floral-bikini', colorId: 'coral', size: 'M' });
    const { fixture, button } = await render();
    expect(button.getAttribute('href')).toBe('/cart');

    button.click();
    await fixture.whenStable();

    expect(drawer()).toBeTruthy();
    expect(dialog()?.getAttribute('aria-modal')).toBe('true');
    const titleId = dialog()?.getAttribute('aria-labelledby');
    expect(document.getElementById(titleId!)?.textContent?.trim()).toBe('კალათა');
    expect(drawer()?.querySelectorAll('[data-testid="cart-line"]')).toHaveLength(1);
    expect(TestBed.inject(Router).url).toBe('/');
  });

  it('closes on Escape and returns focus to the cart button', async () => {
    const { fixture, button } = await render();
    button.focus();
    button.click();
    await fixture.whenStable();
    expect(drawer()).toBeTruthy();

    dialog()!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }),
    );
    await fixture.whenStable();

    expect(drawer()).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it('closes on backdrop click and from the close button', async () => {
    const { fixture, button } = await render();
    button.click();
    await fixture.whenStable();
    document.querySelector<HTMLElement>('.cdk-overlay-backdrop')!.click();
    await fixture.whenStable();
    expect(drawer()).toBeNull();

    button.click();
    await fixture.whenStable();
    drawer()!.querySelector<HTMLButtonElement>('button[aria-label="კალათის დახურვა"]')!.click();
    await fixture.whenStable();
    expect(drawer()).toBeNull();
  });

  it('closes when a link inside it navigates', async () => {
    const { fixture, button } = await render();
    button.click();
    await fixture.whenStable();

    drawer()!.querySelector<HTMLAnchorElement>('[data-testid="cart-empty"] a')!.click();
    await fixture.whenStable();

    expect(drawer()).toBeNull();
  });

  it('goes to the /cart page on narrow screens', async () => {
    wide = false;
    const { fixture, button } = await render();
    button.click();
    await fixture.whenStable();

    expect(drawer()).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/cart');
    expect(fixture.nativeElement.querySelector('app-cart-page')).toBeTruthy();
  });
});
