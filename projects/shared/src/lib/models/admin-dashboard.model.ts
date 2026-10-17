import { LocalizedText } from '../i18n/localized-text';

/** The admin home page numbers (admin_dashboard()). Periods are calendar days/months in Tbilisi. */
export interface AdminDashboard {
  ordersToday: number;
  ordersMonth: number;
  /** Sum of order totals this month including delivery; cancelled orders excluded. */
  revenueMonthGel: number;
  /** Orders waiting for confirmation (status "new"), from any date. */
  newOrders: number;
  /** This month, by quantity sold, top 10; cancelled orders excluded. */
  bestSellers: BestSeller[];
  /** Variants with LOW_STOCK_THRESHOLD items or fewer, lowest first. */
  lowStock: LowStockVariant[];
}

export interface BestSeller {
  /** null when the product has been deleted since (the name is then from the order). */
  productId: string | null;
  name: LocalizedText;
  quantity: number;
  revenueGel: number;
}

export interface LowStockVariant {
  variantId: string;
  productId: string;
  productName: LocalizedText;
  colorName: LocalizedText;
  size: string;
  stock: number;
  sku: string;
  isActive: boolean;
}
