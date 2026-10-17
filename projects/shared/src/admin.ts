/*
 * @cikloni/shared/admin: admin-only code (admin auth, orders, products and dashboard, their Supabase client).
 * A separate entry point so the shop bundle never includes it: top-level tokens and
 * injectable classes are not tree-shaken out of a shared barrel.
 */
export * from './lib/supabase/admin-supabase.client';
export * from './lib/data-access/auth.service';
export * from './lib/data-access/admin-orders.api';
export * from './lib/data-access/admin-products.api';
export * from './lib/data-access/admin-dashboard.api';
