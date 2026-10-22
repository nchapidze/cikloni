/**
 * Checkout config and the create-order contract, shared by the Angular app and the
 * create-order Edge Function. The server is the authority: it recalculates every amount.
 *
 * This file must not import anything: Deno needs ".ts" import extensions and Angular forbids
 * them, so a self-contained file is the one both can compile.
 */

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export const DELIVERY_METHOD_IDS = ['tbilisi', 'regions'] as const;
export type DeliveryMethodId = (typeof DELIVERY_METHOD_IDS)[number];

export interface DeliveryMethod {
  /** Delivery fee in GEL, charged on top of the products. */
  feeGel: number;
  /** City stored on the order; null means the customer types their city or village. */
  fixedCity: string | null;
}

// TODO: placeholder fees, confirm with the courier (design/PRODUCT.md: "[მიწოდების ვადა და ფასი]").
export const DELIVERY_METHODS: Record<DeliveryMethodId, DeliveryMethod> = {
  tbilisi: { feeGel: 5, fixedCity: 'თბილისი' },
  regions: { feeGel: 10, fixedCity: null },
};

// ---------------------------------------------------------------------------
// Payment
// ---------------------------------------------------------------------------

/** Add 'card' here (plus a handler in create-order/index.ts) to enable card payment. */
export const PAYMENT_METHOD_IDS = ['cash'] as const;
export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

/** What the browser does after the order is created. */
export type PaymentNextStep =
  | { type: 'none' } // cash on delivery: show the confirmation
  | { type: 'redirect'; url: string }; // e.g. a bank's card payment page

// ---------------------------------------------------------------------------
// Language
// ---------------------------------------------------------------------------

/** Site languages; stored on the order so emails about it use the customer's language. */
export const ORDER_LANGUAGES = ['ka', 'en'] as const;
export type OrderLanguage = (typeof ORDER_LANGUAGES)[number];

// ---------------------------------------------------------------------------
// Customer details
// ---------------------------------------------------------------------------

export const FIELD_MAX_LENGTH = {
  name: 100,
  email: 254,
  city: 100,
  address: 300,
  notes: 500,
} as const;

/** Most lines one order can have, and the most of one variant per line (the cart's limit). */
export const MAX_ORDER_LINES = 50;
export const MAX_LINE_QUANTITY = 10;

/**
 * Normalizes a Georgian mobile number to +995 followed by 9 digits starting with 5.
 * Accepts "555 12 34 56", "555-123-456", "+995 555 123 456", "995555123456" and so on.
 * Returns null when it is not a Georgian mobile number.
 */
export function normalizeGeorgianPhone(value: string): string | null {
  const digits = value.replace(/[\s\-().]/g, '');
  const match = /^(?:\+?995)?(5\d{8})$/.exec(digits);
  return match ? `+995${match[1]}` : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// create-order request / response
// ---------------------------------------------------------------------------

export interface CreateOrderRequest {
  /** Only ids and quantities: prices and stock are read from the database. */
  items: { variantId: string; quantity: number }[];
  customer: {
    name: string;
    phone: string;
    email?: string;
    /** Ignored when the delivery method has a fixed city. */
    city?: string;
    address: string;
    notes?: string;
  };
  deliveryMethod: DeliveryMethodId;
  paymentMethod: PaymentMethodId;
  /** The site language at checkout. */
  language: OrderLanguage;
}

/** Product and color names are { ka, en } objects, as stored in the database. */
export interface OrderItemSnapshot {
  productName: { ka: string; en?: string };
  colorName: { ka: string; en?: string };
  size: string;
  unitPriceGel: number;
  quantity: number;
}

export interface CreateOrderResult {
  orderNumber: string;
  items: OrderItemSnapshot[];
  subtotalGel: number;
  deliveryFeeGel: number;
  totalGel: number;
  city: string;
  deliveryMethod: DeliveryMethodId;
  paymentMethod: PaymentMethodId;
  payment: PaymentNextStep;
}

/** A requested variant that is out of stock (available < requested) or no longer sold (0). */
export interface StockProblem {
  variantId: string;
  available: number;
}

export type CreateOrderErrorBody =
  | { error: 'INVALID_REQUEST'; fields?: string[] }
  | { error: 'OUT_OF_STOCK'; items: StockProblem[] }
  | { error: 'METHOD_NOT_ALLOWED' | 'SERVER_ERROR' };

export type ParseResult<T> = { ok: true; value: T } | { ok: false; fields: string[] };

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Validates an untrusted create-order body and returns a cleaned request (trimmed text,
 * normalized phone, merged duplicate variants). Lists the invalid fields otherwise.
 */
export function parseCreateOrderRequest(body: unknown): ParseResult<CreateOrderRequest> {
  const fields: string[] = [];
  const input = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const customer = (
    input['customer'] && typeof input['customer'] === 'object' ? input['customer'] : {}
  ) as Record<string, unknown>;

  const deliveryMethod = input['deliveryMethod'] as DeliveryMethodId;
  if (!DELIVERY_METHOD_IDS.includes(deliveryMethod)) fields.push('deliveryMethod');

  const paymentMethod = input['paymentMethod'] as PaymentMethodId;
  if (!PAYMENT_METHOD_IDS.includes(paymentMethod)) fields.push('paymentMethod');

  const quantities = new Map<string, number>();
  const items = input['items'];
  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ORDER_LINES) {
    fields.push('items');
  } else {
    for (const item of items as Record<string, unknown>[]) {
      const variantId = item?.['variantId'];
      const quantity = item?.['quantity'];
      if (
        typeof variantId !== 'string' ||
        !UUID.test(variantId) ||
        !Number.isInteger(quantity) ||
        (quantity as number) < 1 ||
        (quantity as number) > MAX_LINE_QUANTITY
      ) {
        fields.push('items');
        break;
      }
      const id = variantId.toLowerCase();
      quantities.set(id, (quantities.get(id) ?? 0) + (quantity as number));
    }
  }

  const name = text(customer['name']);
  if (!name || name.length > FIELD_MAX_LENGTH.name) fields.push('name');

  const phone = normalizeGeorgianPhone(text(customer['phone']));
  if (!phone) fields.push('phone');

  const email = text(customer['email']);
  if (email && (email.length > FIELD_MAX_LENGTH.email || !EMAIL.test(email))) fields.push('email');

  const fixedCity = DELIVERY_METHODS[deliveryMethod]?.fixedCity ?? null;
  const city = fixedCity ?? text(customer['city']);
  if (!city || city.length > FIELD_MAX_LENGTH.city) fields.push('city');

  const address = text(customer['address']);
  if (!address || address.length > FIELD_MAX_LENGTH.address) fields.push('address');

  const notes = text(customer['notes']);
  if (notes.length > FIELD_MAX_LENGTH.notes) fields.push('notes');

  // Never an error: a tab opened before this field existed still gets its order through.
  const language = ORDER_LANGUAGES.find((l) => l === input['language']) ?? 'ka';

  if (fields.length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      items: [...quantities].map(([variantId, quantity]) => ({ variantId, quantity })),
      customer: {
        name,
        phone: phone!,
        ...(email && { email }),
        city,
        address,
        ...(notes && { notes }),
      },
      deliveryMethod,
      paymentMethod,
      language,
    },
  };
}
