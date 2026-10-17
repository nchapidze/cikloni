import { TestBed } from '@angular/core/testing';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';
import { AdminDashboardApi, toAdminDashboard } from './admin-dashboard.api';

describe('toAdminDashboard', () => {
  it('turns Postgres numerics into numbers', () => {
    const dashboard = toAdminDashboard({
      ordersToday: 1,
      ordersMonth: 5,
      revenueMonth: '199.50',
      newOrders: 0,
      bestSellers: [{ productId: 'p1', name: { ka: 'ბ' }, quantity: '4', revenueGel: '159.60' }],
      lowStock: [],
    });

    expect(dashboard.revenueMonthGel).toBe(199.5);
    expect(dashboard.bestSellers[0]).toEqual({
      productId: 'p1',
      name: { ka: 'ბ' },
      quantity: 4,
      revenueGel: 159.6,
    });
  });
});

describe('AdminDashboardApi', () => {
  it('asks admin_dashboard() with the shared low-stock threshold', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        ordersToday: 0,
        ordersMonth: 0,
        revenueMonth: 0,
        newOrders: 0,
        bestSellers: [],
        lowStock: [],
      },
      error: null,
    });
    TestBed.configureTestingModule({ providers: [{ provide: ADMIN_SUPABASE, useValue: { rpc } }] });

    await TestBed.inject(AdminDashboardApi).getDashboard();

    expect(rpc).toHaveBeenCalledWith('admin_dashboard', { low_stock_threshold: 3 });
  });
});
