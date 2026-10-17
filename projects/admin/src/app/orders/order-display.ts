import { OrderDetails, OrderStatus } from '@cikloni/shared';

export { formatDateTime, formatGel } from '../ui/format';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'ახალი',
  confirmed: 'დადასტურებული',
  shipped: 'გაგზავნილი',
  delivered: 'მიწოდებული',
  cancelled: 'გაუქმებული',
};

/** Full class strings so Tailwind finds them. */
export const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  new: 'bg-sunny',
  confirmed: 'bg-lilac',
  shipped: 'bg-coral-soft',
  delivered: 'bg-mint',
  cancelled: 'bg-border',
};

/** Keys match DELIVERY_METHOD_IDS / PAYMENT_METHOD_IDS in checkout.config. */
const DELIVERY_LABELS: Record<string, string> = { tbilisi: 'თბილისი', regions: 'რეგიონები' };
const PAYMENT_LABELS: Record<string, string> = { cash: 'ნაღდი ანგარიშსწორება მიტანისას' };
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'მოლოდინში',
  paid: 'გადახდილი',
  failed: 'ვერ გადაიხადა',
  refunded: 'დაბრუნებული',
};

export const deliveryLabel = (id: string) => DELIVERY_LABELS[id] ?? id;
export const paymentLabel = (id: string) => PAYMENT_LABELS[id] ?? id;
export const paymentStatusLabel = (id: string) => PAYMENT_STATUS_LABELS[id] ?? id;

/** What the courier needs: name, phone and address, one per line. */
export function courierAddress(order: OrderDetails): string {
  return [order.customerName, order.phone, `${order.city}, ${order.address}`].join('\n');
}
