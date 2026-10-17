-- Fields the storefront needs to replace its mock catalog.

-- Shows the "ბესტსელერი" badge and lists the product in the home page bestsellers section.
alter table public.products
  add column is_bestseller boolean not null default false;

-- null = price not set yet. The storefront shows a "[ფასი] ₾" placeholder, and the order
-- Edge Function must refuse products without a price.
alter table public.products
  alter column price_gel drop not null;
