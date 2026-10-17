import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { mapRows, provideCatalogTesting, SEED_ROWS } from '@cikloni/shared/testing';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { CALCULATOR_CONFIG } from '../../core/calculator/calculator.config';
import { LanguageService } from '../../core/i18n/language.service';
import { Product } from '@cikloni/shared';
import { Home } from './home';

describe('Home', () => {
  async function render(
    listProducts?: () => Promise<Product[]>,
    { stable = true } = {},
  ): Promise<HTMLElement> {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideTranslateTesting(),
        provideCatalogTesting(listProducts),
      ],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    const fixture = TestBed.createComponent(Home);
    if (stable) {
      await fixture.whenStable();
    } else {
      fixture.detectChanges();
    }
    return fixture.nativeElement as HTMLElement;
  }

  it('renders the hero with one h1 and both calls to action', async () => {
    const el = await render();
    expect(el.querySelectorAll('h1')).toHaveLength(1);
    expect(el.querySelector('h1')?.textContent).toContain(
      'შეინარჩუნე სიმშვიდე ქარიშხლიან დღეებშიც',
    );
    const ctas = [...el.querySelectorAll('app-hero-section a')].map((a) => a.getAttribute('href'));
    expect(ctas).toEqual(['/#shop', '/#how']);
  });

  it('renders four numbered benefits', async () => {
    const el = await render();
    const cards = el.querySelectorAll('app-benefit-card');
    expect(cards).toHaveLength(4);
    expect(cards[0].textContent).toContain('დაზოგე');
    expect(cards[3].querySelector('span')?.textContent?.trim()).toBe('4');
  });

  it('renders the calculator teaser right after the benefits', async () => {
    const el = await render();
    const teaser = el.querySelector('app-calculator-teaser-section');
    expect(teaser?.previousElementSibling?.tagName).toBe('APP-BENEFITS-SECTION');
    expect(teaser?.querySelector('a')?.getAttribute('href')).toBe('/calculator');
  });

  it('renders product cards linking to /product/:slug', async () => {
    const el = await render();
    expect(el.querySelector('section#shop')).toBeTruthy();

    const links = [...el.querySelectorAll<HTMLAnchorElement>('app-product-card a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/product/floral-bikini',
      '/product/seamless-hipster',
      '/product/colorful-boxer',
      '/product/lace-brazilian',
    ]);

    const first = links[0];
    expect(first.getAttribute('aria-label')).toBe(
      'ყვავილოვანი ბიკინი, შთანთქმა: საშუალო, [ფასი] ₾',
    );
    expect(first.querySelector('h3')?.textContent?.trim()).toBe('ყვავილოვანი ბიკინი');
    expect(first.textContent).toContain('[ფასი] ₾');
    // Floral bikini comes in four colors; the others in three.
    expect(first.querySelectorAll('.size-4')).toHaveLength(4);
    expect(links[1].querySelectorAll('.size-4')).toHaveLength(3);
  });

  it('gives the product cards alternating tints', async () => {
    const el = await render();
    const tints = [...el.querySelectorAll<HTMLElement>('app-product-card a > div:first-child')].map(
      (div) => div.style.backgroundColor,
    );
    expect(tints).toEqual([
      'var(--color-coral-soft)',
      'var(--color-lilac)',
      'var(--color-sunny)',
      'var(--color-mint)',
    ]);
  });

  it('only lists bestsellers', async () => {
    const [first, ...rest] = SEED_ROWS;
    const el = await render(async () => mapRows([{ ...first, is_bestseller: false }, ...rest]));
    expect(el.querySelectorAll('app-product-card')).toHaveLength(3);
  });

  it('shows skeleton cards while products load', async () => {
    // The request never settles, so don't wait for stability.
    const el = await render(() => new Promise<Product[]>(() => undefined), { stable: false });
    const shop = el.querySelector('section#shop')!;
    expect(shop.getAttribute('aria-busy')).toBe('true');
    expect(shop.querySelectorAll('[data-testid="product-skeleton"]')).toHaveLength(4);
    expect(shop.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'პროდუქტები იტვირთება…',
    );
  });

  it('shows an error with a retry button when products fail to load', async () => {
    const listProducts = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(mapRows(SEED_ROWS));
    const el = await render(listProducts);
    const shop = el.querySelector('section#shop')!;
    expect(shop.querySelector('[role="alert"]')).toBeTruthy();
    expect(shop.querySelector('app-product-card')).toBeNull();

    shop.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(shop.querySelector('[role="alert"]')).toBeNull();
    expect(shop.querySelectorAll('app-product-card')).toHaveLength(4);
  });

  it('renders the three how-it-works steps as an ordered list', async () => {
    const el = await render();
    const steps = el.querySelectorAll('section#how ol > li');
    expect(steps).toHaveLength(3);
    expect(steps[1].querySelector('h3')?.textContent?.trim()).toBe('გარეცხე');
  });

  it('shows 1, 2 and 3 filled drops for the absorbency levels', async () => {
    const el = await render();
    const filled = [...el.querySelectorAll('section#absorbency app-absorbency-drops')].map(
      (drops) => drops.querySelectorAll('[data-filled="true"]').length,
    );
    expect(filled).toEqual([1, 2, 3]);
  });

  it('renders the FAQ as closed details/summary items', async () => {
    const el = await render();
    const items = el.querySelectorAll<HTMLDetailsElement>('section#faq details');
    expect(items).toHaveLength(4);
    expect([...items].every((d) => !d.open)).toBe(true);
    expect(items[0].querySelector('summary')?.textContent).toContain(
      'რამდენ ხანს შეიძლება ტარება?',
    );
  });

  it('fills in the FAQ answers and links the delivery answer to /delivery', async () => {
    const el = await render();
    const items = [...el.querySelectorAll('section#faq details')];
    expect(items.every((d) => !d.textContent?.includes('[პასუხი]'))).toBe(true);
    expect(items[2].textContent).toContain(`${CALCULATOR_CONFIG.PAIRS_NEEDED} წყვილი`);
    expect(items[3].querySelector('a')?.getAttribute('href')).toBe('/delivery');
  });

  it('renders the about section with the large logo', async () => {
    const el = await render();
    const svg = el.querySelector('section#about app-logo-mark svg');
    expect(svg?.getAttribute('width')).toBe('260');
    // Only the spiral spins; the center dot (the "eye") stays still.
    expect(svg?.querySelector('path')?.getAttribute('class')).toBe('motion-safe:animate-cyclone');
    // The sweep goes past the viewBox, so the svg must not clip it.
    expect(svg?.classList).toContain('overflow-visible');
    expect(svg?.querySelector('circle')?.getAttribute('class')).toBeNull();
  });

  describe('newsletter', () => {
    async function setup() {
      const el = await render();
      const form = () => el.querySelector<HTMLFormElement>('app-newsletter-section form');
      const input = () => el.querySelector<HTMLInputElement>('#newsletter-email')!;
      const status = () => el.querySelector('app-newsletter-section [role="status"]')!;
      const submit = async (value: string) => {
        input().value = value;
        input().dispatchEvent(new Event('input'));
        form()!.dispatchEvent(new Event('submit'));
        await TestBed.inject(ApplicationRef).whenStable();
      };
      return { el, form, input, status, submit };
    }

    it('has a visually hidden label for the email input', async () => {
      const { el } = await setup();
      const label = el.querySelector('label[for="newsletter-email"]');
      expect(label?.textContent?.trim()).toBe('ელფოსტა');
      expect(label?.classList).toContain('sr-only');
    });

    it('shows an error for an invalid email and keeps the form', async () => {
      const { el, form, input, status, submit } = await setup();
      await submit('not-an-email');

      expect(form()).toBeTruthy();
      expect(input().getAttribute('aria-invalid')).toBe('true');
      expect(input().getAttribute('aria-describedby')).toBe('newsletter-error');
      expect(el.querySelector('#newsletter-error')?.textContent).toContain(
        'შეიყვანე სწორი ელფოსტა.',
      );
      expect(status().textContent?.trim()).toBe('');
    });

    it('replaces the form with a thank-you message on a valid email', async () => {
      const { form, status, submit } = await setup();
      await submit('nino@example.com');

      expect(form()).toBeNull();
      expect(status().textContent?.trim()).toBe('მადლობა! სიახლეებს პირველი შენ გაიგებ.');
    });
  });
});
