import { Injectable, inject } from '@angular/core';
import { LocalizedText } from '../i18n/localized-text';
import {
  OrderDetails,
  OrderListItem,
  OrderListPage,
  OrderListQuery,
  OrderStatus,
  StatusChangeFailure,
} from '../models/order.model';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';

export class StatusChangeError extends Error {
  constructor(readonly failure: StatusChangeFailure) {
    super(failure);
  }
}

/** Shape of an `orders` row as selected by LIST_SELECT. */
interface OrderRow {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  phone: string;
  city: string;
  total_gel: number | string;
  status: OrderStatus;
}

/** Shape of an `orders` row with its items, as selected by DETAILS_SELECT. */
interface OrderDetailsRow extends OrderRow {
  email: string | null;
  address: string;
  notes: string | null;
  delivery_method: string;
  payment_method: string;
  payment_status: string;
  subtotal_gel: number | string;
  delivery_fee_gel: number | string;
  order_items: {
    id: string;
    product_name: LocalizedText;
    color_name: LocalizedText;
    size: string;
    unit_price_gel: number | string;
    quantity: number;
  }[];
}

const LIST_SELECT = 'id, order_number, created_at, customer_name, phone, city, total_gel, status';
const DETAILS_SELECT = `
  ${LIST_SELECT}, email, address, notes, delivery_method, payment_method, payment_status,
  subtotal_gel, delivery_fee_gel,
  order_items (id, product_name, color_name, size, unit_price_gel, quantity)
`;

const STATUS_FAILURES: readonly StatusChangeFailure[] = [
  'FORBIDDEN',
  'ORDER_NOT_FOUND',
  'STATUS_CHANGED',
  'INVALID_TRANSITION',
];

/**
 * PostgREST `or=(...)` filter for the search box. Characters that are part of the filter
 * syntax or LIKE wildcards are dropped, so input cannot add conditions. The phone is matched
 * on digits only: it is stored normalized (+995555123456) while people type "555 12 34 56".
 */
export function orderSearchFilter(search: string): string | null {
  const term = search.replace(/[%_*,()"\\:]/g, ' ').trim();
  if (!term) return null;
  const filters = [`customer_name.ilike.*${term}*`, `order_number.ilike.*${term}*`];
  const digits = term.replace(/\D/g, '');
  if (digits.length >= 3) filters.push(`phone.ilike.*${digits}*`);
  return filters.join(',');
}

// Postgres numeric arrives as a JSON number; Number() also covers a string.
export function toOrderListItem(row: OrderRow): OrderListItem {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: new Date(row.created_at),
    customerName: row.customer_name,
    phone: row.phone,
    city: row.city,
    totalGel: Number(row.total_gel),
    status: row.status,
  };
}

export function toOrderDetails(row: OrderDetailsRow): OrderDetails {
  return {
    ...toOrderListItem(row),
    email: row.email,
    address: row.address,
    notes: row.notes,
    deliveryMethod: row.delivery_method,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotalGel: Number(row.subtotal_gel),
    deliveryFeeGel: Number(row.delivery_fee_gel),
    // Same order as create_order's confirmation (by item id).
    items: [...row.order_items]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((item) => ({
        id: item.id,
        productName: item.product_name,
        colorName: item.color_name,
        size: item.size,
        unitPriceGel: Number(item.unit_price_gel),
        quantity: item.quantity,
      })),
  };
}

/** Orders for the admin app. RLS lets only admins read them; changes go through RPCs. */
@Injectable({ providedIn: 'root' })
export class AdminOrdersApi {
  private readonly supabase = inject(ADMIN_SUPABASE);

  /** Newest first, one page at a time, with the total number of matches. */
  async listOrders(query: OrderListQuery, signal?: AbortSignal): Promise<OrderListPage> {
    let request = this.supabase
      .from('orders')
      .select(LIST_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(query.offset, query.offset + query.limit - 1);
    if (query.status) request = request.eq('status', query.status);
    const search = query.search ? orderSearchFilter(query.search) : null;
    if (search) request = request.or(search);
    if (signal) request = request.abortSignal(signal);

    const { data, count, error } = await request;
    if (error) throw error;
    return { orders: (data as OrderRow[]).map(toOrderListItem), total: count ?? 0 };
  }

  /** null when there is no such order. */
  async getOrder(id: string, signal?: AbortSignal): Promise<OrderDetails | null> {
    let request = this.supabase.from('orders').select(DETAILS_SELECT).eq('id', id);
    if (signal) request = request.abortSignal(signal);

    const { data, error } = await request.maybeSingle();
    if (error) {
      // invalid_text_representation: the id is not a uuid, so there is no such order.
      if (error.code === '22P02') return null;
      throw error;
    }
    return data ? toOrderDetails(data as unknown as OrderDetailsRow) : null;
  }

  /**
   * Changes the status if it is still `from`; cancelling also returns the items to stock, in
   * the same transaction (set_order_status). Throws StatusChangeError.
   */
  async setStatus(id: string, from: OrderStatus, to: OrderStatus): Promise<void> {
    const { error } = await this.supabase.rpc('set_order_status', {
      order_id: id,
      new_status: to,
      expected_status: from,
    });
    if (!error) return;
    const failure = STATUS_FAILURES.find((f) => f === error.message) ?? 'NETWORK';
    throw new StatusChangeError(failure);
  }
}
