// The email templates live with the Edge Functions; like checkout.ts they import nothing, so
// they can be tested here.
import {
  EmailOrder,
  adminNewOrderEmail,
  escapeHtml,
  formatGel,
  orderConfirmationEmail,
  orderShippedEmail,
} from '../../../../../supabase/functions/_shared/order-emails';

const links = { shopUrl: 'https://cikloni.ge', logoUrl: 'https://cikloni.ge/email/logo.png' };

function order(overrides: Partial<EmailOrder> = {}): EmailOrder {
  return {
    orderNumber: 'CK-001001',
    customerName: 'ნინო',
    phone: '+995555123456',
    email: 'nino@example.com',
    city: 'თბილისი',
    address: 'ვაჟა-ფშაველას 1',
    notes: null,
    deliveryMethod: 'tbilisi',
    paymentMethod: 'cash',
    items: [
      {
        productName: { ka: 'ფერადი ბოქსერი', en: 'Colorful boxer' },
        colorName: { ka: 'ნარინჯისფერი' },
        size: 'M',
        unitPriceGel: 39.9,
        quantity: 2,
      },
    ],
    subtotalGel: 79.8,
    deliveryFeeGel: 5,
    totalGel: 84.8,
    language: 'ka',
    ...overrides,
  };
}

describe('formatGel', () => {
  it('formats like the shop: comma decimals in Georgian, whole amounts without decimals', () => {
    expect(formatGel(84.8, 'ka')).toBe('84,80 ₾');
    expect(formatGel(84.8, 'en')).toBe('84.80 ₾');
    expect(formatGel(5, 'ka')).toBe('5 ₾');
  });
});

describe('escapeHtml', () => {
  it('escapes markup and quotes', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('orderConfirmationEmail', () => {
  it('is in Georgian for a Georgian order, with items, totals and next steps', () => {
    const email = orderConfirmationEmail(order(), links);

    expect(email.subject).toBe('მადლობა! შეკვეთა CK-001001 მიღებულია');
    expect(email.html).toContain('<html lang="ka">');
    expect(email.html).toContain('ფერადი ბოქსერი');
    expect(email.html).toContain('79,80 ₾');
    expect(email.html).toContain('84,80 ₾');
    expect(email.html).toContain('კურიერი შეკვეთას 1–2 სამუშაო დღეში მოგიტანს.');
    expect(email.html).toContain('გადაიხდი კურიერთან, შეკვეთის მიღებისას.');
    expect(email.text).toContain('შეკვეთის ნომერი: CK-001001');
  });

  it('is in English for an English order, falling back to Georgian names without a translation', () => {
    const email = orderConfirmationEmail(order({ language: 'en' }), links);

    expect(email.subject).toBe('Thank you! We’ve received order CK-001001');
    expect(email.html).toContain('<html lang="en">');
    expect(email.html).toContain('Colorful boxer');
    expect(email.html).toContain('Color: ნარინჯისფერი');
    expect(email.html).toContain('84.80 ₾');
  });

  it('has the brand header, logo, slogan and links back to the shop', () => {
    const { html } = orderConfirmationEmail(order(), links);

    expect(html).toContain('src="https://cikloni.ge/email/logo.png"');
    expect(html).toContain('alt="cikloni"');
    expect(html).toContain('შეინარჩუნე სიმშვიდე ქარიშხლიან დღეებშიც');
    expect(html).toContain('background:#3A1D45');
    expect(html).toContain('href="https://cikloni.ge/contact"');
    expect(html).toContain('href="https://cikloni.ge/returns"');
    expect(html).toContain('name="viewport"');
  });

  it('escapes customer input', () => {
    const { html } = orderConfirmationEmail(
      order({ customerName: '<img src=x onerror=alert(1)>', address: '"><script>' }),
      links,
    );
    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});

describe('orderShippedEmail', () => {
  it('tells the customer the order is on its way and what to pay the courier', () => {
    const email = orderShippedEmail(order(), links);

    expect(email.subject).toBe('შეკვეთა CK-001001 გზაშია');
    expect(email.html).toContain('შენი შეკვეთა გზაშია!');
    expect(email.html).toContain('მიტანისას გადასახდელი თანხა: 84,80 ₾');
  });

  it('is in English for an English order and skips the cash line for other payments', () => {
    const email = orderShippedEmail(order({ language: 'en', paymentMethod: 'card' }), links);

    expect(email.subject).toBe('Order CK-001001 is on its way');
    expect(email.html).not.toContain('Amount to pay on delivery');
  });
});

describe('adminNewOrderEmail', () => {
  const adminOrderUrl = 'https://admin.cikloni.ge/orders/0000-1111';

  it('is in Georgian with the customer details and a link to the order in the admin app', () => {
    const email = adminNewOrderEmail(order({ language: 'en', notes: 'დარეკე' }), {
      ...links,
      adminOrderUrl,
    });

    expect(email.subject).toBe('ახალი შეკვეთა CK-001001 · 84,80 ₾');
    expect(email.html).toContain('<html lang="ka">');
    expect(email.html).toContain(`href="${adminOrderUrl}"`);
    expect(email.html).toContain('+995555123456');
    expect(email.html).toContain('დარეკე');
    expect(email.html).toContain('ინგლისური');
    // Georgian product names even when the customer ordered in English.
    expect(email.html).toContain('ფერადი ბოქსერი');
    expect(email.text).toContain(adminOrderUrl);
  });
});
