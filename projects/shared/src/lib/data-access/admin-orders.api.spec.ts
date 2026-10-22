import { TestBed } from '@angular/core/testing';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import { ADMIN_SUPABASE } from '../supabase/admin-supabase.client';
import {
  AdminOrdersApi,
  StatusChangeError,
  orderSearchFilter,
  toOrderDetails,
} from './admin-orders.api';

describe('orderSearchFilter', () => {
  it('matches name and order number, and the phone by digits', () => {
    expect(orderSearchFilter(' 555 12 34 ')).toBe(
      'customer_name.ilike.*555 12 34*,order_number.ilike.*555 12 34*,phone.ilike.*5551234*',
    );
  });

  it('skips the phone for digit-less or short terms', () => {
    expect(orderSearchFilter('ნინო')).toBe('customer_name.ilike.*ნინო*,order_number.ilike.*ნინო*');
    expect(orderSearchFilter('CK-1')).toBe('customer_name.ilike.*CK-1*,order_number.ilike.*CK-1*');
  });

  it('drops filter syntax and wildcards so input cannot add conditions', () => {
    expect(orderSearchFilter('a,status.eq.new')).toBe(
      'customer_name.ilike.*a status.eq.new*,order_number.ilike.*a status.eq.new*',
    );
    expect(orderSearchFilter('%_*(),"\\:')).toBeNull();
    expect(orderSearchFilter('   ')).toBeNull();
  });
});

describe('toOrderDetails', () => {
  it('maps numeric strings to numbers and sorts items like the confirmation', () => {
    const order = toOrderDetails({
      id: 'o1',
      order_number: 'CK-001001',
      created_at: '2026-10-17T08:30:00Z',
      customer_name: 'ნინო',
      phone: '+995555123456',
      city: 'თბილისი',
      total_gel: '84.80',
      status: 'new',
      email: null,
      address: 'ჭავჭავაძის 10',
      notes: null,
      delivery_method: 'tbilisi',
      payment_method: 'cash',
      payment_status: 'pending',
      subtotal_gel: 79.8,
      delivery_fee_gel: '5.00',
      order_items: [
        {
          id: 'b',
          product_name: { ka: 'ბ' },
          color_name: { ka: 'ვ' },
          size: 'M',
          unit_price_gel: '39.90',
          quantity: 1,
        },
        {
          id: 'a',
          product_name: { ka: 'ა' },
          color_name: { ka: 'ვ' },
          size: 'S',
          unit_price_gel: 39.9,
          quantity: 1,
        },
      ],
    });

    expect(order.totalGel).toBe(84.8);
    expect(order.deliveryFeeGel).toBe(5);
    expect(order.createdAt.toISOString()).toBe('2026-10-17T08:30:00.000Z');
    expect(order.items.map((i) => [i.id, i.unitPriceGel])).toEqual([
      ['a', 39.9],
      ['b', 39.9],
    ]);
  });
});

describe('AdminOrdersApi.setStatus', () => {
  /** `error`: the Edge Function's { error } body, or a fetch failure without a response. */
  function setup(error: string | 'fetch' | null) {
    const invoke = vi.fn().mockResolvedValue(
      error === null
        ? { data: { status: 'cancelled' }, error: null }
        : {
            data: null,
            error:
              error === 'fetch'
                ? new FunctionsFetchError(new TypeError('Failed to fetch'))
                : new FunctionsHttpError(new Response(JSON.stringify({ error }), { status: 409 })),
          },
    );
    TestBed.configureTestingModule({
      providers: [{ provide: ADMIN_SUPABASE, useValue: { functions: { invoke } } }],
    });
    return { api: TestBed.inject(AdminOrdersApi), invoke };
  }

  it('calls set-order-status with the status the admin saw', async () => {
    const { api, invoke } = setup(null);

    await api.setStatus('o1', 'new', 'cancelled');

    expect(invoke).toHaveBeenCalledWith('set-order-status', {
      body: { orderId: 'o1', from: 'new', to: 'cancelled' },
    });
  });

  it.each(['STATUS_CHANGED', 'INVALID_TRANSITION', 'FORBIDDEN', 'ORDER_NOT_FOUND'])(
    'reports %s',
    async (message) => {
      const { api } = setup(message);
      await expect(api.setStatus('o1', 'new', 'shipped')).rejects.toEqual(
        new StatusChangeError(message as never),
      );
    },
  );

  it('reports anything else as NETWORK', async () => {
    for (const error of ['SERVER_ERROR', 'fetch']) {
      TestBed.resetTestingModule();
      const { api } = setup(error);
      await expect(api.setStatus('o1', 'new', 'shipped')).rejects.toMatchObject({
        failure: 'NETWORK',
      });
    }
  });
});
