import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DELIVERY_METHODS } from '@cikloni/shared';
import { provideTranslateTesting } from '../../testing/translate-testing';
import { LanguageService } from '../core/i18n/language.service';
import { Footer } from '../layout/footer/footer';
import { ContactPage } from './contact/contact';
import { DeliveryPage } from './delivery/delivery';
import { PrivacyPage } from './privacy/privacy';
import { ReturnsPage } from './returns/returns';
import { TermsPage } from './terms/terms';

/** Delivery, returns, privacy, terms and contact pages, and their footer links. */
describe('info pages', () => {
  async function render(component: Type<unknown>, lang: 'ka' | 'en' = 'ka') {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [component],
      providers: [provideRouter([]), provideTranslateTesting()],
    });
    const language = TestBed.inject(LanguageService);
    await firstValueFrom(language.init());
    await firstValueFrom(language.use(lang));
    const fixture = TestBed.createComponent(component);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const textOf = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

  it.each([
    [DeliveryPage, 'მიწოდება'],
    [ReturnsPage, 'დაბრუნების პოლიტიკა'],
    [PrivacyPage, 'კონფიდენციალურობის პოლიტიკა'],
    [TermsPage, 'მომსახურების პირობები'],
    [ContactPage, 'კონტაქტი'],
  ])('renders %o with one translated h1 and no raw keys', async (component, title) => {
    for (const lang of ['ka', 'en'] as const) {
      const el = await render(component, lang);
      expect(el.querySelectorAll('h1')).toHaveLength(1);
      if (lang === 'ka') expect(textOf(el.querySelector('h1'))).toBe(title);
      // An untranslated key would render as e.g. "DELIVERY.AREAS.TITLE".
      expect(el.textContent).not.toMatch(/\b[A-Z_]+\.[A-Z_.]+\b/);
      TestBed.resetTestingModule();
    }
  });

  it('shows the delivery fees from the checkout config', async () => {
    const el = await render(DeliveryPage);
    const fees = [...el.querySelectorAll('[data-testid="delivery-fee"]')].map(textOf);
    expect(fees).toEqual([
      `${DELIVERY_METHODS.tbilisi.feeGel} ₾`,
      `${DELIVERY_METHODS.regions.feeGel} ₾`,
    ]);
    expect(textOf(el.querySelector('[data-testid="delivery-methods"]'))).toContain(
      '1–2 სამუშაო დღე',
    );
  });

  it('lists the enabled payment methods in the terms', async () => {
    const el = await render(TermsPage);
    expect(textOf(el.querySelector('[data-testid="terms-payment"]'))).toContain(
      'ნაღდი ანგარიშსწორება მიტანისას',
    );
  });

  it('shows placeholders on the contact page until phone and email are set', async () => {
    const el = await render(ContactPage);
    const items = textOf(el.querySelector('[data-testid="contact-items"]'));
    expect(items).toContain('[ტელეფონის ნომერი]');
    expect(items).toContain('[ელფოსტა]');
    const instagram = el.querySelector<HTMLAnchorElement>('a[href*="instagram.com"]');
    expect(instagram?.target).toBe('_blank');
    expect(el.querySelector('a[href^="tel:"], a[href^="mailto:"]')).toBeNull();
  });

  it('links the footer to every info page', async () => {
    const el = await render(Footer);
    const hrefs = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(
      expect.arrayContaining(['/delivery', '/returns', '/privacy', '/terms', '/contact']),
    );
  });
});
