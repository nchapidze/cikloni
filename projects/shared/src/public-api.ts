/*
 * @cikloni/shared: code used by both the shop and the admin app. Admin-only code is in
 * @cikloni/shared/admin and spec helpers in @cikloni/shared/testing. Apps import only from
 * these entry points, never from each other.
 */

// i18n
export * from './lib/i18n/localized-text';
export * from './lib/i18n/localized.pipe';

// Models
export * from './lib/models/product.model';
export * from './lib/models/product.palette';
export * from './lib/models/checkout.config';
export * from './lib/models/order.model';

// Supabase setup
export * from './lib/supabase/supabase.config';
export * from './lib/supabase/supabase.client';

// Data access
export * from './lib/data-access/products.api';
export * from './lib/data-access/orders.api';

// UI
export * from './lib/ui/logo-mark/logo-mark';
