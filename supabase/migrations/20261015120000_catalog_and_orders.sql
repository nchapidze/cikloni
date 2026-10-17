-- Catalog, orders and admins.
-- Translatable text is stored as jsonb shaped { "ka": string, "en"?: string }.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- True when value is an object with a non-empty string "ka", an optional string "en",
-- and no other keys. Immutable so it can be used in CHECK constraints.
create function public.is_localized_text(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and jsonb_typeof(value -> 'ka') = 'string'
    and btrim(value ->> 'ka') <> ''
    and (not value ? 'en' or jsonb_typeof(value -> 'en') = 'string')
    and (value - 'ka' - 'en') = '{}'::jsonb;
$$;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.absorbency_level as enum ('light', 'medium', 'heavy');
create type public.order_status as enum ('new', 'confirmed', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.products (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        jsonb not null check (public.is_localized_text(name)),
  description jsonb check (public.is_localized_text(description)),
  care        jsonb check (public.is_localized_text(care)),
  price_gel   numeric(10, 2) not null check (price_gel >= 0),
  absorbency  public.absorbency_level not null,
  is_active   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index products_active_sort_idx on public.products (sort_order) where is_active;

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  color_id    text not null check (color_id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  color_name  jsonb not null check (public.is_localized_text(color_name)),
  color_hex   text not null check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  size        text not null check (size in ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  stock       integer not null default 0 check (stock >= 0),
  sku         text not null unique,
  unique (product_id, color_id, size)
);

create table public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  -- null = shown for every color.
  color_id     text,
  -- Path inside the "product-images" storage bucket.
  storage_path text not null unique,
  sort_order   integer not null default 0
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Orders (written only server-side, by an Edge Function using the service role)
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq start 1001;

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  -- Human-readable, e.g. CK-001001.
  order_number     text not null unique
                   default ('CK-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  status           public.order_status not null default 'new',
  customer_name    text not null check (btrim(customer_name) <> ''),
  phone            text not null check (btrim(phone) <> ''),
  email            text,
  city             text not null check (btrim(city) <> ''),
  address          text not null check (btrim(address) <> ''),
  notes            text,
  delivery_method  text not null,
  payment_method   text not null,
  payment_status   public.payment_status not null default 'pending',
  subtotal_gel     numeric(10, 2) not null check (subtotal_gel >= 0),
  delivery_fee_gel numeric(10, 2) not null default 0 check (delivery_fee_gel >= 0),
  total_gel        numeric(10, 2) not null,
  created_at       timestamptz not null default now(),
  check (total_gel = subtotal_gel + delivery_fee_gel)
);

alter sequence public.order_number_seq owned by public.orders.order_number;

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

-- Snapshot of what was bought: names and price are copied at purchase time, so later
-- catalog edits or deletions never change past orders.
create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  variant_id     uuid references public.product_variants (id) on delete set null,
  product_name   jsonb not null check (public.is_localized_text(product_name)),
  color_name     jsonb not null check (public.is_localized_text(color_name)),
  size           text not null,
  unit_price_gel numeric(10, 2) not null check (unit_price_gel >= 0),
  quantity       integer not null check (quantity > 0)
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_variant_idx on public.order_items (variant_id);

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
