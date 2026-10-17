import { Injectable, inject } from '@angular/core';
import { LocalizedText } from '../i18n/localized-text';
import { LOW_STOCK_THRESHOLD } from '../models/admin-product.model';
import { AdminDashboard } from '../models/admin-dashboard.model';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';

/** What admin_dashboard() returns. Postgres numeric may arrive as a number or a string. */
interface DashboardRow {
  ordersToday: number;
  ordersMonth: number;
  revenueMonth: number | string;
  newOrders: number;
  bestSellers: {
    productId: string | null;
    name: LocalizedText;
    quantity: number | string;
    revenueGel: number | string;
  }[];
  lowStock: AdminDashboard['lowStock'];
}

export function toAdminDashboard(row: DashboardRow): AdminDashboard {
  return {
    ordersToday: Number(row.ordersToday),
    ordersMonth: Number(row.ordersMonth),
    revenueMonthGel: Number(row.revenueMonth),
    newOrders: Number(row.newOrders),
    bestSellers: row.bestSellers.map((b) => ({
      productId: b.productId,
      name: b.name,
      quantity: Number(b.quantity),
      revenueGel: Number(b.revenueGel),
    })),
    lowStock: row.lowStock,
  };
}

/** The admin home page numbers, computed in the database (admin_dashboard). */
@Injectable({ providedIn: 'root' })
export class AdminDashboardApi {
  private readonly supabase = inject(ADMIN_SUPABASE);

  async getDashboard(signal?: AbortSignal): Promise<AdminDashboard> {
    let request = this.supabase.rpc('admin_dashboard', {
      low_stock_threshold: LOW_STOCK_THRESHOLD,
    });
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return toAdminDashboard(data as DashboardRow);
  }
}
