-- Row Level Security for every table.
-- With RLS on, a role sees and changes nothing unless a policy allows it.
-- The service role (Edge Functions) bypasses RLS; that is how orders get created.

-- ---------------------------------------------------------------------------
-- is_admin(): lives in a schema the REST API does not expose, so it cannot be
-- called as an RPC. SECURITY DEFINER lets it read public.admins without hitting
-- that table's own RLS (which would otherwise recurse).
-- ---------------------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images   enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;
alter table public.admins           enable row level security;

-- Defense in depth: anonymous visitors get no table privileges at all on private data,
-- so even a mistaken future policy cannot expose it to them.
revoke all on public.orders, public.order_items, public.admins from anon;
revoke all on sequence public.order_number_seq from anon;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create policy "Public can read active products"
  on public.products for select
  to anon, authenticated
  using (is_active);

create policy "Admins can manage products"
  on public.products for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------

create policy "Public can read variants of active products"
  on public.product_variants for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id and p.is_active
    )
  );

create policy "Admins can manage variants"
  on public.product_variants for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------

create policy "Public can read images of active products"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.is_active
    )
  );

create policy "Admins can manage product images"
  on public.product_images for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- orders / order_items: no public policies at all. Customers place orders through
-- an Edge Function that recalculates prices from the database.
-- ---------------------------------------------------------------------------

create policy "Admins can manage orders"
  on public.orders for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Admins can manage order items"
  on public.order_items for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- admins
-- ---------------------------------------------------------------------------

-- Lets the Angular admin guard check "am I an admin?" for the signed-in user.
create policy "Users can read their own admin row"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage admins"
  on public.admins for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
