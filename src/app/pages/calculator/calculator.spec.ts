import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { LanguageService } from '../../core/i18n/language.service';
import { CalculatorPage } from './calculator';

describe('CalculatorPage', () => {
  async function render() {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CalculatorPage],
      providers: [provideRouter([]), provideTranslateTesting()],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    const fixture = TestBed.createComponent(CalculatorPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const setValue = async (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await TestBed.inject(ApplicationRef).whenStable();
    };
    const headline = () => el.querySelector('[data-testid="calc-headline"]')?.textContent ?? '';
    // Collapse whitespace so the big number and its unit read as one string.
    const items = () =>
      (el.querySelector('[data-testid="calc-items"]')?.textContent ?? '').replace(/s+/g, ' ');
    return { el, setValue, headline, items };
  }

  it('labels every input', async () => {
    const { el } = await render();
    for (const id of ['calc-per-day', 'calc-days', 'calc-pack-price', 'calc-pack-size']) {
      expect(el.querySelector(`label[for="${id}"]`)?.textContent?.trim()).toBeTruthy();
    }
    expect(el.querySelectorAll('fieldset button[aria-pressed]')).toHaveLength(3);
  });

  it('shows savings and items avoided for the defaults', async () => {
    const { headline, items } = await render();
    // Defaults: 4/day * 5 days * 12 * (10 ₾ / 10) * 2 years = 480 ₾; Cikloni 5 * 40 = 200 ₾.
    expect(headline()).toContain('280 ₾');
    expect(items()).toContain('ნაგავში აღარ მოხვდება');
    expect(items()).toContain('480 საფენი');
  });

  it('updates live when an input changes', async () => {
    const { setValue, headline } = await render();
    await setValue('#calc-per-day', '6'); // 6 * 5 * 12 * 2 = 720 ₾
    expect(headline()).toContain('520 ₾');
  });

  it('changes the items-avoided wording with the current product', async () => {
    const { el, items } = await render();
    const tampons = el.querySelectorAll<HTMLButtonElement>('fieldset button')[1];
    tampons.click();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(tampons.getAttribute('aria-pressed')).toBe('true');
    expect(items()).toContain('480 ტამპონი');
  });

  it('shows a friendly message instead of negative savings', async () => {
    const { el, setValue, headline, items } = await render();
    await setValue('#calc-pack-price', '1');
    expect(headline()).toContain('ფულს ვერ დაგიზოგავს');
    expect(headline()).not.toContain('-');
    // Items avoided stays visible as a headline stat.
    expect(items()).toContain('480 საფენი');
    expect(el.querySelectorAll('[role="region"] li .bg-mint')).toHaveLength(1);
  });

  it('flags an invalid pack size and hides the results', async () => {
    const { el, setValue } = await render();
    await setValue('#calc-pack-size', '0');

    const input = el.querySelector('#calc-pack-size')!;
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('calc-pack-size-error');
    expect(el.querySelector('#calc-pack-size-error')?.textContent).toContain('მინიმუმ 1');
    expect(el.querySelector('[data-testid="calc-invalid"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="calc-headline"]')).toBeNull();
  });

  it('flags a negative or empty pack price', async () => {
    const { el, setValue } = await render();
    await setValue('#calc-pack-price', '-5');
    expect(el.querySelector('#calc-pack-price')?.getAttribute('aria-invalid')).toBe('true');
    await setValue('#calc-pack-price', '');
    expect(el.querySelector('#calc-pack-price')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('links to the shop', async () => {
    const { el } = await render();
    const shop = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('იყიდე ახლა'));
    expect(shop?.getAttribute('href')).toBe('/#shop');
  });
});
