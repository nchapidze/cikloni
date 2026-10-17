import { InjectionToken, inject } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './supabase.config';

/**
 * Supabase client for the admin app. It keeps its own session under a separate storage key,
 * so a storefront client on the same origin never sends an admin's token (which would show
 * inactive products).
 */
export const ADMIN_SUPABASE = new InjectionToken<SupabaseClient>('ADMIN_SUPABASE', {
  providedIn: 'root',
  factory: () => {
    const { url, publishableKey } = inject(SUPABASE_CONFIG);
    return createClient(url, publishableKey, {
      auth: { storageKey: 'cikloni-admin-auth', persistSession: true, autoRefreshToken: true },
    });
  },
});
