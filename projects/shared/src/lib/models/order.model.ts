import { LocalizedText } from '../i18n/localized-text';

/** Mirrors the public.order_status enum. */
export const ORDER_STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return ORDER_STATUSES.includes(value as OrderStatus);
}

/** The forward flow; cancelled sits outside it. */
const FLOW: readonly OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered'];

/**
 * Mirrors set_order_status(), which is the authority: statuses only move forward (steps may be
 * skipped), cancelling is possible until delivery, and delivered / cancelled are final.
 * Used by the UI only to offer the changes the server would accept.
 */
export function canChangeStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  if (from === 'delivered' || from === 'cancelled') return false;
  return to === 'cancelled' || FLOW.indexOf(to) > FLOW.indexOf(from);
}

export interface OrderListItem {
  id: string;
  /** e.g. CK-001001 */
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  phone: string;
  city: string;
  totalGel: number;
  status: OrderStatus;
}

/** A snapshot of what was bought: names and price as they were at purchase time. */
export interface OrderItem {
  id: string;
  productName: LocalizedText;
  colorName: LocalizedText;
  size: string;
  unitPriceGel: number;
  quantity: number;
}

export interface OrderDetails extends OrderListItem {
  email: string | null;
  address: string;
  /** The customer's comment for the courier. */
  notes: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotalGel: number;
  deliveryFeeGel: number;
  items: OrderItem[];
}

export interface OrderListQuery {
  status?: OrderStatus;
  /** Matches customer name, phone or order number. */
  search?: string;
  offset: number;
  limit: number;
}

export interface OrderListPage {
  orders: OrderListItem[];
  /** Matches across all pages. */
  total: number;
}

/**
 * Why a status change was refused (set_order_status errors, plus NETWORK when there was no
 * usable answer). STATUS_CHANGED: someone else changed the status first.
 */
export type StatusChangeFailure =
  'FORBIDDEN' | 'ORDER_NOT_FOUND' | 'STATUS_CHANGED' | 'INVALID_TRANSITION' | 'NETWORK';
