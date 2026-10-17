// create-order: guest checkout. Validates the request, then calls public.create_order, which
// re-reads prices and stock and writes the order, its items and the stock change in one
// transaction. Deployed with verify_jwt = false (see supabase/config.toml): guests have no
// session, and the publishable key is not a JWT.

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  type CreateOrderErrorBody,
  type CreateOrderResult,
  DELIVERY_METHODS,
  type PaymentMethodId,
  type PaymentNextStep,
  parseCreateOrderRequest,
} from '../_shared/checkout.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Service role: bypasses RLS. Provided by the Edge runtime, never shipped to the browser.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
);

type OrderRow = Omit<CreateOrderResult, 'deliveryMethod' | 'paymentMethod' | 'payment'>;

/**
 * Starts payment for a new order. Card payment adds an entry here that creates a payment
 * session with the bank and returns { type: 'redirect', url }.
 */
const PAYMENT_HANDLERS: Record<PaymentMethodId, (order: OrderRow) => Promise<PaymentNextStep>> = {
  cash: () => Promise.resolve({ type: 'none' }),
};

function json(status: number, body: CreateOrderResult | CreateOrderErrorBody): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'INVALID_REQUEST' });
  }

  const parsed = parseCreateOrderRequest(body);
  if (!parsed.ok) return json(400, { error: 'INVALID_REQUEST', fields: parsed.fields });
  const request = parsed.value;

  const { data, error } = await supabase.rpc('create_order', {
    customer: request.customer,
    items: request.items,
    delivery_method: request.deliveryMethod,
    delivery_fee_gel: DELIVERY_METHODS[request.deliveryMethod].feeGel,
    payment_method: request.paymentMethod,
  });

  if (error) {
    if (error.message === 'OUT_OF_STOCK') {
      return json(409, { error: 'OUT_OF_STOCK', items: JSON.parse(error.details ?? '[]') });
    }
    console.error('create_order failed', error);
    return json(500, { error: 'SERVER_ERROR' });
  }

  const order = data as OrderRow;
  try {
    const payment = await PAYMENT_HANDLERS[request.paymentMethod](order);
    return json(200, {
      ...order,
      deliveryMethod: request.deliveryMethod,
      paymentMethod: request.paymentMethod,
      payment,
    });
  } catch (paymentError) {
    // The order exists; an admin follows up on its pending payment.
    console.error('payment start failed', order.orderNumber, paymentError);
    return json(500, { error: 'SERVER_ERROR' });
  }
});
