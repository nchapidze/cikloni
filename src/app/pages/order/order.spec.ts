import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom } from 'rxjs';
import { provideTranslateTesting } from '../../../testing/translate-testing';
import { OrderConfirmations } from '../../core/checkout/order-confirmations';
import { LanguageService } from '../../core/i18n/language.service';
import { OrderPage } from './order';

describe('OrderPage', () => {
  let el: HTMLElement;

  async function open(orderNumber: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'order/:orderNumber', component: OrderPage }],
          withComponentInputBinding(),
        ),
        provideTranslateTesting(),
      ],
    });
    await firstValueFrom(TestBed.inject(LanguageService).init());
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(`/order/${orderNumber}`, OrderPage);
    el = harness.routeNativeElement!;
  }

  const text = (selector: string) =>
    el.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();
  const steps = () =>
    [...el.querySelectorAll('[data-testid="order-next"] li > span:last-child')].map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim(),
    );

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('shows the summary, delivery details and next steps for an order from this session', async () => {
    new OrderConfirmations().save({
      orderNumber: 'CK-001002',
      items: [
        {
          productName: { ka: 'ფერადი ბოქსერი', en: 'Colorful boxer' },
          colorName: { ka: 'ნარინჯისფერი', en: 'Orange' },
          size: 'L',
          unitPriceGel: 35,
          quantity: 1,
        },
      ],
      subtotalGel: 35,
      deliveryFeeGel: 10,
      totalGel: 45,
      city: 'ქუთაისი',
      deliveryMethod: 'regions',
      paymentMethod: 'cash',
      payment: { type: 'none' },
      customer: { name: 'ნინო', phone: '+995555123456', address: 'რუსთაველის 5' },
    });
    await open('CK-001002');

    expect(text('h1')).toBe('მადლობა შეკვეთისთვის!');
    expect(text('[data-testid="order-number"]')).toBe('CK-001002');
    expect(text('[data-testid="summary-line"]')).toContain('ფერადი ბოქსერი');
    expect(text('[data-testid="summary-delivery"]')).toBe('10 ₾');
    expect(text('[data-testid="summary-total"]')).toBe('45 ₾');
    expect(text('[data-testid="order-delivery"]')).toBe('ნინო +995555123456 ქუთაისი, რუსთაველის 5');
    expect(steps()).toEqual([
      'ჩვენი გუნდი დაგიკავშირდება შეკვეთის დასადასტურებლად.',
      'კურიერი შეკვეთას 2–4 სამუშაო დღეში მოგიტანს.',
      'გადაიხდი კურიერთან, შეკვეთის მიღებისას.',
      'შეკვეთა დისკრეტულ შეფუთვაში მოვა.',
    ]);
  });

  it('still thanks the customer when the order is not in this session', async () => {
    await open('CK-009999');

    expect(text('h1')).toBe('მადლობა შეკვეთისთვის!');
    expect(text('[data-testid="order-number"]')).toBe('CK-009999');
    expect(el.querySelector('app-order-summary')).toBeNull();
    expect(el.querySelector('[data-testid="order-delivery"]')).toBeNull();
    expect(steps()[1]).toBe('კურიერი შეკვეთას მითითებულ მისამართზე მოგიტანს.');
  });
});
