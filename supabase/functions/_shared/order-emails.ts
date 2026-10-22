/**
 * Order emails: the customer's confirmation and "shipped" emails (Georgian or English) and the
 * shop's new-order notification (Georgian, like the admin app). Pure functions that return
 * the subject, HTML and plain text; sending lives in email.ts.
 *
 * Like checkout.ts this file must not import anything, so the Angular test runner can load it
 * too (projects/shared/src/lib/models/order-emails.spec.ts).
 */

export type EmailLanguage = 'ka' | 'en';

/** Product and color names are { ka, en } objects, as stored on the order items. */
export interface EmailOrderItem {
  productName: { ka: string; en?: string };
  colorName: { ka: string; en?: string };
  size: string;
  unitPriceGel: number;
  quantity: number;
}

export interface EmailOrder {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  notes: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  items: EmailOrderItem[];
  subtotalGel: number;
  deliveryFeeGel: number;
  totalGel: number;
  language: EmailLanguage;
}

export interface EmailLinks {
  /** e.g. https://cikloni.ge, without a trailing slash. */
  shopUrl: string;
  /** Absolute URL of the PNG logo (public/email/logo.png); SVG does not show in Gmail. */
  logoUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// Email clients cannot read CSS variables: these are the design/DESIGN.md tokens.
const BRAND = {
  plum: '#3A1D45',
  blush: '#FDEDEF',
  background: '#FFF8F8',
  border: '#F3D9DE',
  coral: '#F37A8C',
  white: '#FFFFFF',
  font: "'Noto Sans Georgian', 'Segoe UI', Roboto, Arial, sans-serif",
};

// ---------------------------------------------------------------------------
// Copy. The delivery, payment and next-step lines match src/assets/i18n (CHECKOUT.*, ORDER.*);
// keep them in sync when that copy changes.
// ---------------------------------------------------------------------------

const COPY = {
  ka: {
    slogan: 'შეინარჩუნე სიმშვიდე ქარიშხლიან დღეებშიც',
    greeting: (name: string) => `გამარჯობა, ${name}!`,
    orderNumber: 'შეკვეთის ნომერი',
    yourOrder: 'შენი შეკვეთა',
    itemDetails: (color: string, size: string, quantity: number) =>
      `ფერი: ${color} · ზომა: ${size} · × ${quantity}`,
    subtotal: 'პროდუქტები',
    delivery: (method: string) => `მიწოდება — ${method}`,
    total: 'სულ',
    deliveryAddress: 'მიწოდების მისამართი',
    nextTitle: 'რა ხდება შემდეგ?',
    questions: 'კითხვა გაქვს? სიამოვნებით დაგეხმარებით.',
    contactUs: 'დაგვიკავშირდი',
    footerLinks: { delivery: 'მიწოდება', returns: 'დაბრუნება', privacy: 'კონფიდენციალურობა' },
    footerReason: 'ამ წერილს გიგზავნით, რადგან cikloni.ge-ზე შეკვეთა გააფორმე.',
    deliveryMethods: { tbilisi: 'თბილისი', regions: 'რეგიონები' } as Record<string, string>,
    deliveryTimes: {
      tbilisi: 'კურიერი შეკვეთას 1–2 სამუშაო დღეში მოგიტანს.',
      regions: 'კურიერი შეკვეთას 2–4 სამუშაო დღეში მოგიტანს.',
    } as Record<string, string>,
    payments: { cash: 'გადაიხდი კურიერთან, შეკვეთის მიღებისას.' } as Record<string, string>,
    discreet: 'შეკვეთა დისკრეტულ შეფუთვაში მოვა.',
    confirmation: {
      subject: (number: string) => `მადლობა! შეკვეთა ${number} მიღებულია`,
      title: 'მადლობა შეკვეთისთვის!',
      intro: 'შენი შეკვეთა მივიღეთ. ჩვენი გუნდი დაგიკავშირდება შეკვეთის დასადასტურებლად.',
    },
    shipped: {
      subject: (number: string) => `შეკვეთა ${number} გზაშია`,
      title: 'შენი შეკვეთა გზაშია!',
      intro: 'კარგი ამბავი: შეკვეთა კურიერს გადავეცით. კურიერი დაგიკავშირდება, სანამ მოვა.',
      payOnDelivery: (total: string) => `მიტანისას გადასახდელი თანხა: ${total}`,
    },
  },
  en: {
    slogan: 'Stay calm on stormy days',
    greeting: (name: string) => `Hi ${name}!`,
    orderNumber: 'Order number',
    yourOrder: 'Your order',
    itemDetails: (color: string, size: string, quantity: number) =>
      `Color: ${color} · Size: ${size} · × ${quantity}`,
    subtotal: 'Products',
    delivery: (method: string) => `Delivery — ${method}`,
    total: 'Total',
    deliveryAddress: 'Delivery address',
    nextTitle: 'What happens next?',
    questions: 'Have a question? We’re happy to help.',
    contactUs: 'Contact us',
    footerLinks: { delivery: 'Delivery', returns: 'Returns', privacy: 'Privacy' },
    footerReason: 'You’re receiving this email because you placed an order on cikloni.ge.',
    deliveryMethods: { tbilisi: 'Tbilisi', regions: 'Regions' } as Record<string, string>,
    deliveryTimes: {
      tbilisi: 'A courier will deliver your order within 1–2 business days.',
      regions: 'A courier will deliver your order within 2–4 business days.',
    } as Record<string, string>,
    payments: { cash: 'Pay the courier when you receive your order.' } as Record<string, string>,
    discreet: 'Your order arrives in discreet packaging.',
    confirmation: {
      subject: (number: string) => `Thank you! We’ve received order ${number}`,
      title: 'Thank you for your order!',
      intro: 'We’ve received your order. Our team will contact you to confirm it.',
    },
    shipped: {
      subject: (number: string) => `Order ${number} is on its way`,
      title: 'Your order is on its way!',
      intro: 'Good news: your order is with the courier. They’ll contact you before arriving.',
      payOnDelivery: (total: string) => `Amount to pay on delivery: ${total}`,
    },
  },
} satisfies Record<EmailLanguage, unknown>;

/** The shop's notification is Georgian only, like the admin app. */
const ADMIN_COPY = {
  subject: (number: string, total: string) => `ახალი შეკვეთა ${number} · ${total}`,
  title: 'ახალი შეკვეთა',
  customer: 'მომხმარებელი',
  items: 'პროდუქტები',
  name: 'სახელი',
  phone: 'ტელეფონი',
  email: 'ელფოსტა',
  address: 'მისამართი',
  notes: 'კომენტარი',
  deliveryMethod: 'მიწოდება',
  payment: 'გადახდა',
  language: 'წერილების ენა',
  languages: { ka: 'ქართული', en: 'ინგლისური' },
  payments: { cash: 'ნაღდი ანგარიშსწორება მიტანისას' } as Record<string, string>,
  open: 'შეკვეთის ნახვა ადმინში',
  none: '—',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escapes text for HTML content and attribute values. Customer input always goes through it. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "39,90 ₾" / "39.90 ₾"; whole amounts drop the decimals (same as the shop's price pipe). */
export function formatGel(amount: number, language: EmailLanguage): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  const price = new Intl.NumberFormat(language === 'ka' ? 'ka-GE' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
  return `${price} ₾`;
}

function localized(text: { ka: string; en?: string }, language: EmailLanguage): string {
  return (language === 'en' && text.en) || text.ka;
}

const e = escapeHtml;

function paragraph(html: string, style = ''): string {
  return `<p style="margin:0 0 16px;${style}">${html}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
  <tr><td style="border-radius:999px;background:${BRAND.plum};">
    <a href="${e(href)}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:${BRAND.plum};color:${BRAND.blush};font-family:${BRAND.font};font-size:16px;font-weight:700;line-height:20px;text-decoration:none;">${e(label)}</a>
  </td></tr>
</table>`;
}

/** Items with their line totals, then subtotal, delivery and total. */
function itemsTable(order: EmailOrder, language: EmailLanguage, deliveryLabel: string): string {
  const copy = COPY[language];
  const money = (amount: number) => e(formatGel(amount, language));
  const rows = order.items
    .map((item) => {
      const details = copy.itemDetails(
        localized(item.colorName, language),
        item.size,
        item.quantity,
      );
      return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};vertical-align:top;">
    <strong>${e(localized(item.productName, language))}</strong><br>
    <span style="font-size:14px;">${e(details)}</span>
  </td>
  <td style="padding:12px 0 12px 12px;border-bottom:1px solid ${BRAND.border};text-align:right;vertical-align:top;white-space:nowrap;">${money(item.unitPriceGel * item.quantity)}</td>
</tr>`;
    })
    .join('');
  const sumRow = (label: string, amount: number, strong = false) =>
    `<tr>
  <td style="padding:${strong ? '12px' : '4px'} 0 4px;${strong ? 'font-size:18px;font-weight:800;' : ''}">${e(label)}</td>
  <td style="padding:${strong ? '12px' : '4px'} 0 4px 12px;text-align:right;white-space:nowrap;${strong ? 'font-size:18px;font-weight:800;' : ''}">${money(amount)}</td>
</tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;font-size:16px;">
${rows}
<tr><td colspan="2" style="padding-top:8px;"></td></tr>
${sumRow(copy.subtotal, order.subtotalGel)}
${sumRow(copy.delivery(deliveryLabel), order.deliveryFeeGel)}
${sumRow(copy.total, order.totalGel, true)}
</table>`;
}

function infoBox(title: string, lines: string[]): string {
  const items = lines
    .map(
      (line) =>
        `<tr><td style="padding:4px 10px 4px 0;vertical-align:top;color:${BRAND.coral};font-size:18px;line-height:24px;">&#9679;</td><td style="padding:4px 0;">${e(line)}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;background:${BRAND.blush};border-radius:20px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 8px;font-weight:800;">${e(title)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">${items}</table>
  </td></tr>
</table>`;
}

/**
 * The shared frame: plum header with the logo and slogan, white content card, blush footer.
 * Fluid up to 600px wide, so it fits phones without a media query; the query only trims padding.
 */
function layout(options: {
  language: EmailLanguage;
  subject: string;
  preheader: string;
  content: string;
  links: EmailLinks;
  footer: string;
}): string {
  const { language, links } = options;
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${e(options.subject)}</title>
<style>
  @media (max-width: 620px) {
    .card { padding: 28px 20px !important; }
    .title { font-size: 24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${e(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.background};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:${BRAND.font};color:${BRAND.plum};font-size:16px;line-height:1.6;">
    <tr><td align="center" style="background:${BRAND.plum};border-radius:24px 24px 0 0;padding:28px 24px 24px;">
      <a href="${e(links.shopUrl)}" style="text-decoration:none;">
        <img src="${e(links.logoUrl)}" width="200" height="48" alt="cikloni" style="display:block;margin:0 auto;border:0;outline:none;color:${BRAND.blush};font-size:28px;font-weight:600;">
      </a>
      <p style="margin:12px 0 0;color:${BRAND.blush};font-size:14px;line-height:1.4;">${e(COPY[language].slogan)}</p>
    </td></tr>
    <tr><td class="card" style="background:${BRAND.white};padding:36px 40px 16px;border-left:1px solid ${BRAND.border};border-right:1px solid ${BRAND.border};">
${options.content}
    </td></tr>
    <tr><td align="center" style="background:${BRAND.blush};border-radius:0 0 24px 24px;padding:20px 24px;font-size:13px;line-height:1.6;">
${options.footer}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function customerFooter(language: EmailLanguage, links: EmailLinks): string {
  const copy = COPY[language];
  const link = (path: string, label: string) =>
    `<a href="${e(links.shopUrl + path)}" style="color:${BRAND.plum};font-weight:700;">${e(label)}</a>`;
  return `<p style="margin:0 0 8px;">${link('/delivery', copy.footerLinks.delivery)} &nbsp;·&nbsp; ${link('/returns', copy.footerLinks.returns)} &nbsp;·&nbsp; ${link('/privacy', copy.footerLinks.privacy)}</p>
<p style="margin:0;">${e(copy.footerReason)}</p>`;
}

function textItems(order: EmailOrder, language: EmailLanguage, deliveryLabel: string): string[] {
  const copy = COPY[language];
  return [
    ...order.items.map(
      (item) =>
        `- ${localized(item.productName, language)} (${copy.itemDetails(localized(item.colorName, language), item.size, item.quantity)}): ${formatGel(item.unitPriceGel * item.quantity, language)}`,
    ),
    `${copy.subtotal}: ${formatGel(order.subtotalGel, language)}`,
    `${copy.delivery(deliveryLabel)}: ${formatGel(order.deliveryFeeGel, language)}`,
    `${copy.total}: ${formatGel(order.totalGel, language)}`,
  ];
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

/** To the customer, right after checkout. */
export function orderConfirmationEmail(order: EmailOrder, links: EmailLinks): RenderedEmail {
  const language = order.language;
  const copy = COPY[language];
  const subject = copy.confirmation.subject(order.orderNumber);
  const deliveryLabel = copy.deliveryMethods[order.deliveryMethod] ?? order.deliveryMethod;
  const nextSteps = [
    copy.deliveryTimes[order.deliveryMethod],
    copy.payments[order.paymentMethod],
    copy.discreet,
  ].filter((line): line is string => !!line);
  const address = `${order.city}, ${order.address}`;

  const content = `
<h1 class="title" style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:800;">${e(copy.confirmation.title)}</h1>
${paragraph(e(copy.greeting(order.customerName)))}
${paragraph(e(copy.confirmation.intro))}
${paragraph(`${e(copy.orderNumber)}: <strong style="font-size:18px;">${e(order.orderNumber)}</strong>`)}
<h2 style="margin:8px 0 4px;font-size:20px;font-weight:800;">${e(copy.yourOrder)}</h2>
${itemsTable(order, language, deliveryLabel)}
<h2 style="margin:0 0 4px;font-size:20px;font-weight:800;">${e(copy.deliveryAddress)}</h2>
${paragraph(`${e(order.customerName)}<br>${e(order.phone)}<br>${e(address)}`)}
${infoBox(copy.nextTitle, nextSteps)}
${paragraph(e(copy.questions), 'font-weight:700;')}
${button(`${links.shopUrl}/contact`, copy.contactUs)}`;

  const text = [
    copy.confirmation.title,
    '',
    copy.greeting(order.customerName),
    copy.confirmation.intro,
    '',
    `${copy.orderNumber}: ${order.orderNumber}`,
    '',
    `${copy.yourOrder}:`,
    ...textItems(order, language, deliveryLabel),
    '',
    `${copy.deliveryAddress}: ${order.customerName}, ${order.phone}, ${address}`,
    '',
    `${copy.nextTitle}`,
    ...nextSteps.map((line) => `- ${line}`),
    '',
    `${copy.questions} ${links.shopUrl}/contact`,
  ].join('\n');

  return {
    subject,
    text,
    html: layout({
      language,
      subject,
      preheader: copy.confirmation.intro,
      content,
      links,
      footer: customerFooter(language, links),
    }),
  };
}

/** To the customer, when the order's status changes to "shipped". */
export function orderShippedEmail(order: EmailOrder, links: EmailLinks): RenderedEmail {
  const language = order.language;
  const copy = COPY[language];
  const subject = copy.shipped.subject(order.orderNumber);
  const deliveryLabel = copy.deliveryMethods[order.deliveryMethod] ?? order.deliveryMethod;
  const address = `${order.city}, ${order.address}`;
  const total = formatGel(order.totalGel, language);
  // Only cash is collected at the door; a card order is already paid.
  const payLine = order.paymentMethod === 'cash' ? copy.shipped.payOnDelivery(total) : null;

  const content = `
<h1 class="title" style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:800;">${e(copy.shipped.title)}</h1>
${paragraph(e(copy.greeting(order.customerName)))}
${paragraph(e(copy.shipped.intro))}
${paragraph(`${e(copy.orderNumber)}: <strong style="font-size:18px;">${e(order.orderNumber)}</strong>`)}
${payLine ? paragraph(`<strong>${e(payLine)}</strong>`) : ''}
<h2 style="margin:8px 0 4px;font-size:20px;font-weight:800;">${e(copy.deliveryAddress)}</h2>
${paragraph(`${e(order.customerName)}<br>${e(order.phone)}<br>${e(address)}`)}
<h2 style="margin:8px 0 4px;font-size:20px;font-weight:800;">${e(copy.yourOrder)}</h2>
${itemsTable(order, language, deliveryLabel)}
${paragraph(e(copy.discreet))}
${paragraph(e(copy.questions), 'font-weight:700;')}
${button(`${links.shopUrl}/contact`, copy.contactUs)}`;

  const text = [
    copy.shipped.title,
    '',
    copy.greeting(order.customerName),
    copy.shipped.intro,
    '',
    `${copy.orderNumber}: ${order.orderNumber}`,
    ...(payLine ? [payLine] : []),
    '',
    `${copy.deliveryAddress}: ${order.customerName}, ${order.phone}, ${address}`,
    '',
    `${copy.yourOrder}:`,
    ...textItems(order, language, deliveryLabel),
    '',
    copy.discreet,
    `${copy.questions} ${links.shopUrl}/contact`,
  ].join('\n');

  return {
    subject,
    text,
    html: layout({
      language,
      subject,
      preheader: copy.shipped.intro,
      content,
      links,
      footer: customerFooter(language, links),
    }),
  };
}

/** To the shop, for every new order. Always Georgian; links to the order in the admin app. */
export function adminNewOrderEmail(
  order: EmailOrder,
  links: EmailLinks & { adminOrderUrl: string },
): RenderedEmail {
  const copy = COPY.ka;
  const total = formatGel(order.totalGel, 'ka');
  const subject = ADMIN_COPY.subject(order.orderNumber, total);
  const deliveryLabel = copy.deliveryMethods[order.deliveryMethod] ?? order.deliveryMethod;
  const details: [string, string][] = [
    [ADMIN_COPY.name, order.customerName],
    [ADMIN_COPY.phone, order.phone],
    [ADMIN_COPY.email, order.email ?? ADMIN_COPY.none],
    [ADMIN_COPY.address, `${order.city}, ${order.address}`],
    [ADMIN_COPY.notes, order.notes ?? ADMIN_COPY.none],
    [ADMIN_COPY.deliveryMethod, deliveryLabel],
    [ADMIN_COPY.payment, ADMIN_COPY.payments[order.paymentMethod] ?? order.paymentMethod],
    [ADMIN_COPY.language, ADMIN_COPY.languages[order.language]],
  ];
  const detailRows = details
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 16px 4px 0;vertical-align:top;white-space:nowrap;font-weight:700;">${e(label)}</td><td style="padding:4px 0;">${e(value)}</td></tr>`,
    )
    .join('');

  const content = `
<h1 class="title" style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:800;">${e(ADMIN_COPY.title)} ${e(order.orderNumber)}</h1>
${button(links.adminOrderUrl, ADMIN_COPY.open)}
<h2 style="margin:0 0 4px;font-size:20px;font-weight:800;">${e(ADMIN_COPY.customer)}</h2>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;font-size:16px;">${detailRows}</table>
<h2 style="margin:0 0 4px;font-size:20px;font-weight:800;">${e(ADMIN_COPY.items)}</h2>
${itemsTable(order, 'ka', deliveryLabel)}`;

  const text = [
    `${ADMIN_COPY.title} ${order.orderNumber}`,
    links.adminOrderUrl,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    ...textItems(order, 'ka', deliveryLabel),
  ].join('\n');

  return {
    subject,
    text,
    html: layout({
      language: 'ka',
      subject,
      preheader: `${order.customerName}, ${order.city} · ${total}`,
      content,
      links,
      footer: `<p style="margin:0;">cikloni.ge</p>`,
    }),
  };
}
