import { InjectionToken } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Supabase client for the admin panel. It keeps its own session under a separate storage key,
 * so the storefront client never sends an admin's token (which would show inactive products).
 * Only referenced from lazy-loaded admin code, so it stays out of the customer bundle.
 */
export const ADMIN_SUPABASE = new InjectionToken<SupabaseClient>('ADMIN_SUPABASE', {
  providedIn: 'root',
  factory: () =>
    createClient(environment.supabase.url, environment.supabase.publishableKey, {
      auth: { storageKey: 'cikloni-admin-auth', persistSession: true, autoRefreshToken: true },
    }),
});
