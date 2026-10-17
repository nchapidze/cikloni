-- admin_dashboard: the admin home page numbers, computed in the database so the browser never
-- loads all orders. Called by the admin app through Supabase RPC.
--
-- "Today" and "this month" are calendar periods in Tbilisi time (the shop's time zone).
--
-- Returns:
-- {
--   "ordersToday":    int,      orders placed today (any status)
--   "ordersMonth":    int,      orders placed this month (any status)
--   "revenueMonth":   numeric,  sum of total_gel this month (incl. delivery), cancelled excluded
--   "newOrders":      int,      orders waiting for confirmation (status 'new'), any date
--   "bestSellers":    [{ productId | null, name, quantity, revenueGel }]  this month, top 10,
--                     cancelled excluded; productId is null if the product was deleted since
--   "lowStock":       [{ variantId, productId, productName, colorName, size, stock, sku,
--                        isActive }]  variants with stock <= low_stock_threshold, lowest first
-- }
--
-- Raises (SQLSTATE P0001): FORBIDDEN when the caller is not an admin.

create function public.admin_dashboard(low_stock_threshold integer default 3)
returns jsonb
language plpgsql
stable
-- Runs as the caller: RLS (admins only) applies to every table read here.
security invoker
set search_path = ''
as $$
declare
  local_now   timestamp := now() at time zone 'Asia/Tbilisi';
  today_start timestamptz := date_trunc('day', local_now) at time zone 'Asia/Tbilisi';
  month_start timestamptz := date_trunc('month', local_now) at time zone 'Asia/Tbilisi';
begin
  if not (select private.is_admin()) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  return jsonb_build_object(
    'ordersToday', (
      select count(*) from public.orders o where o.created_at >= today_start
    ),
    'ordersMonth', (
      select count(*) from public.orders o where o.created_at >= month_start
    ),
    'revenueMonth', (
      select coalesce(sum(o.total_gel), 0)
      from public.orders o
      where o.created_at >= month_start and o.status <> 'cancelled'
    ),
    'newOrders', (
      select count(*) from public.orders o where o.status = 'new'
    ),
    'bestSellers', (
      select coalesce(jsonb_agg(to_jsonb(b) order by b.quantity desc, b."revenueGel" desc), '[]'::jsonb)
      from (
        select
          v.product_id as "productId",
          -- The current name if the product still exists, else the name at purchase time.
          coalesce(p.name, (array_agg(oi.product_name))[1]) as name,
          sum(oi.quantity) as quantity,
          sum(oi.quantity * oi.unit_price_gel) as "revenueGel"
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        left join public.product_variants v on v.id = oi.variant_id
        left join public.products p on p.id = v.product_id
        where o.created_at >= month_start and o.status <> 'cancelled'
        -- Items of deleted products are grouped by their Georgian name.
        group by v.product_id, p.name, case when v.product_id is null then oi.product_name ->> 'ka' end
        order by sum(oi.quantity) desc, sum(oi.quantity * oi.unit_price_gel) desc
        limit 10
      ) as b
    ),
    'lowStock', (
      select coalesce(jsonb_agg(to_jsonb(l) order by l.stock, l."productName" ->> 'ka', l.sku), '[]'::jsonb)
      from (
        select
          v.id as "variantId",
          p.id as "productId",
          p.name as "productName",
          v.color_name as "colorName",
          v.size,
          v.stock,
          v.sku,
          p.is_active as "isActive"
        from public.product_variants v
        join public.products p on p.id = v.product_id
        where v.stock <= low_stock_threshold
        order by v.stock, p.name ->> 'ka', v.sku
        limit 100
      ) as l
    )
  );
end;
$$;

revoke all on function public.admin_dashboard(integer) from public, anon, authenticated;
grant execute on function public.admin_dashboard(integer) to authenticated;
