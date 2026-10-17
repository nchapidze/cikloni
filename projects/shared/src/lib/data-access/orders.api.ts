import { Injectable, inject } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import {
  CreateOrderErrorBody,
  CreateOrderRequest,
  CreateOrderResult,
} from '../models/checkout.config';
import { SUPABASE } from '../supabase/supabase.client';

/** Why an order was not created. NETWORK: the request never got an answer. */
export type CreateOrderFailure = CreateOrderErrorBody | { error: 'NETWORK' };

export class CreateOrderError extends Error {
  constructor(readonly failure: CreateOrderFailure) {
    super(failure.error);
  }
}

/** Places orders through the create-order Edge Function. */
@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly supabase = inject(SUPABASE);

  /** Throws CreateOrderError when the order was not created. */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResult> {
    const { data, error } = await this.supabase.functions.invoke<CreateOrderResult>(
      'create-order',
      { body: request },
    );
    if (!error && data) return data;

    if (error instanceof FunctionsHttpError) {
      const body = await (error.context as Response).json().catch(() => null);
      throw new CreateOrderError(body?.error ? body : { error: 'SERVER_ERROR' });
    }
    throw new CreateOrderError({ error: 'NETWORK' });
  }
}
