import { InjectionToken } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * The storefront Supabase client (publishable key; all access is governed by RLS). Customers
 * never sign in, so it keeps no session; the admin panel has its own client (ADMIN_SUPABASE).
 */
export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () =>
    createClient(environment.supabase.url, environment.supabase.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }),
});
