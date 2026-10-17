import { InjectionToken, Provider } from '@angular/core';

/** Public values only: the publishable key is designed to ship to browsers (RLS applies). */
export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('SUPABASE_CONFIG');

/** Each app passes its own environment. Never put the secret / service_role key here. */
export function provideSupabaseConfig(config: SupabaseConfig): Provider {
  return { provide: SUPABASE_CONFIG, useValue: config };
}
