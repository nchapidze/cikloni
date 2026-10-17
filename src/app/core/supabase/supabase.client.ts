import { InjectionToken } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/** The app-wide Supabase client (publishable key; all access is governed by RLS). */
export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () => createClient(environment.supabase.url, environment.supabase.publishableKey),
});
