import { Injectable } from '@angular/core';
import { CreateOrderResult } from '@cikloni/shared';

/** What the order page shows: the server's result plus the contact details from the form. */
export interface OrderConfirmation extends CreateOrderResult {
  customer: { name: string; phone: string; address: string };
}

const STORAGE_KEY = 'cikloni.orders';
const MAX_KEPT = 5;

/**
 * Keeps recent order confirmations for this browser tab (sessionStorage), so /order/:number
 * survives a refresh. Orders can't be read back from the API: their numbers are sequential,
 * so a lookup by number would expose other customers' details.
 */
@Injectable({ providedIn: 'root' })
export class OrderConfirmations {
  save(confirmation: OrderConfirmation): void {
    const kept = this.read().filter((c) => c.orderNumber !== confirmation.orderNumber);
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([confirmation, ...kept].slice(0, MAX_KEPT)),
      );
    } catch {
      // Storage unavailable: the order page then shows the order number only.
    }
  }

  get(orderNumber: string): OrderConfirmation | undefined {
    return this.read().find((c) => c.orderNumber === orderNumber);
  }

  private read(): OrderConfirmation[] {
    try {
      const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
