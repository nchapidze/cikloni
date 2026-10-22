// set-order-status: the admin app's status change. Calls public.set_order_status with the
// caller's own token, so the admin check, the status flow and returning stock all stay in SQL.
// Deployed with verify_jwt = false (see supabase/config.toml), like create-order: anyone who is
// not a signed-in admin is refused by set_order_status itself.
//
// When an order has just become "shipped", the customer is emailed in the background (if they
// gave an email); a failed email is logged and never undoes or fails the status change.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { emailConfig, emailLinks, runInBackground, sendEmail } from '../_shared/email.ts';
import { type EmailLanguage, type EmailOrder, orderShippedEmail } from '../_shared/order-emails.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = (typeof STATUSES)[number];

/** set_order_status's errors, passed on to the admin app as { error }. */
const FAILURE_STATUS = {
  FORBIDDEN: 403,
  ORDER_NOT_FOUND: 404,
  STATUS_CHANGED: 409,
  INVALID_TRANSITION: 409,
} as const;
type Failure = keyof typeof FAILURE_STATUS;

type ResponseBody =
  | { status: OrderStatus }
  | { error: Failure | 'INVALID_REQUEST' | 'METHOD_NOT_ALLOWED' | 'SERVER_ERROR' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Service role, for reading the order's email details after the change succeeded.
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

function json(status: number, body: ResponseBody): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const isStatus = (value: unknown): value is OrderStatus => STATUSES.includes(value as OrderStatus);

interface ShippedOrderRow {
  order_number: string;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string;
  address: string;
  notes: string | null;
  delivery_method: string;
  payment_method: string;
  subtotal_gel: number | string;
  delivery_fee_gel: number | string;
  total_gel: number | string;
  language: EmailLanguage;
  order_items: {
    id: string;
    product_name: EmailOrder['items'][number]['productName'];
    color_name: EmailOrder['items'][number]['colorName'];
    size: string;
    unit_price_gel: number | string;
    quantity: number;
  }[];
}

async function sendShippedEmail(orderId: string): Promise<void> {
  const config = emailConfig();
  if (!config) return;

  const { data, error } = await admin
    .from('orders')
    .select(
      `order_number, customer_name, phone, email, city, address, notes, delivery_method,
       payment_method, subtotal_gel, delivery_fee_gel, total_gel, language,
       order_items (id, product_name, color_name, size, unit_price_gel, quantity)`,
    )
    .eq('id', orderId)
    .single();
  if (error) throw error;
  const row = data as unknown as ShippedOrderRow;
  if (!row.email) return;

  // Postgres numeric may arrive as a string; Number() covers both.
  const order: EmailOrder = {
    orderNumber: row.order_number,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    city: row.city,
    address: row.address,
    notes: row.notes,
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    // Same order as the confirmation (by item id).
    items: [...row.order_items]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => ({
        productName: item.product_name,
        colorName: item.color_name,
        size: item.size,
        unitPriceGel: Number(item.unit_price_gel),
        quantity: item.quantity,
      })),
    subtotalGel: Number(row.subtotal_gel),
    deliveryFeeGel: Number(row.delivery_fee_gel),
    totalGel: Number(row.total_gel),
    language: row.language,
  };

  await sendEmail(config, {
    ...orderShippedEmail(order, emailLinks(config)),
    to: row.email,
    replyTo: config.replyTo,
    // An order becomes "shipped" at most once (statuses never go back).
    idempotencyKey: `order-shipped/${order.orderNumber}`,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });

  const authorization = req.headers.get('Authorization');
  if (!authorization) return json(403, { error: 'FORBIDDEN' });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'INVALID_REQUEST' });
  }
  const { orderId, from, to } = body ?? {};
  if (typeof orderId !== 'string' || !UUID.test(orderId) || !isStatus(from) || !isStatus(to)) {
    return json(400, { error: 'INVALID_REQUEST' });
  }

  // As the caller: set_order_status checks that they are an admin.
  const caller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data, error } = await caller.rpc('set_order_status', {
    order_id: orderId,
    new_status: to,
    expected_status: from,
  });

  if (error) {
    if (error.message in FAILURE_STATUS) {
      const failure = error.message as Failure;
      return json(FAILURE_STATUS[failure], { error: failure });
    }
    // 42501: no execute permission (not signed in); PGRST3xx: missing, invalid or expired JWT.
    if (error.code === '42501' || error.code?.startsWith('PGRST3')) {
      return json(403, { error: 'FORBIDDEN' });
    }
    console.error('set_order_status failed', orderId, error);
    return json(500, { error: 'SERVER_ERROR' });
  }

  // from === to is a no-op in set_order_status, so this is a real change to "shipped".
  if (to === 'shipped' && from !== 'shipped') {
    runInBackground('shipped email', () => sendShippedEmail(orderId));
  }
  return json(200, { status: data as OrderStatus });
});
