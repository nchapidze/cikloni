import { InjectionToken, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './supabase.config';

/**
 * The storefront Supabase client (publishable key; all access is governed by RLS). Customers
 * never sign in, so it keeps no session; the admin app has its own client (ADMIN_SUPABASE).
 */
export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () => {
    const { url, publishableKey } = inject(SUPABASE_CONFIG);
    return createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  },
});
