-- set_order_status: the only way to change an order's status. Called by the admin app through
-- Supabase RPC; the status change and the stock update happen in one transaction.
--
-- Status flow: new -> confirmed -> shipped -> delivered (steps may be skipped, never reversed),
-- or cancelled from any status before delivered. delivered and cancelled are final.
-- Cancelling returns every item of the order to stock.
--
-- expected_status is the status the admin saw; if it no longer matches (someone else changed
-- it meanwhile), nothing changes, so two admins cannot overwrite each other.
--
-- Raises (SQLSTATE P0001):
--   FORBIDDEN          the caller is not an admin
--   ORDER_NOT_FOUND    no order with this id
--   STATUS_CHANGED     the order's status is no longer expected_status
--   INVALID_TRANSITION the flow above does not allow this change

create function public.set_order_status(
  order_id        uuid,
  new_status      public.order_status,
  expected_status public.order_status
)
returns public.order_status
language plpgsql
-- Runs as the owner so it can update stock; access is checked explicitly below.
security definer
set search_path = ''
as $$
declare
  current_status public.order_status;
  flow constant public.order_status[] :=
    array['new', 'confirmed', 'shipped', 'delivered']::public.order_status[];
begin
  if not (select private.is_admin()) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  -- Lock the order: concurrent status changes on it wait here, then see the new status.
  select o.status into current_status
  from public.orders o
  where o.id = set_order_status.order_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'ORDER_NOT_FOUND';
  end if;

  if current_status <> expected_status then
    raise exception using errcode = 'P0001', message = 'STATUS_CHANGED';
  end if;

  if new_status = current_status then
    return current_status;
  end if;

  if current_status in ('delivered', 'cancelled')
     or (new_status <> 'cancelled'
         and array_position(flow, new_status) < array_position(flow, current_status)) then
    raise exception using errcode = 'P0001', message = 'INVALID_TRANSITION';
  end if;

  if new_status = 'cancelled' then
    -- Same lock order as create_order (variant id), so the two cannot deadlock.
    perform 1
    from public.product_variants v
    where v.id in (
      select oi.variant_id from public.order_items oi where oi.order_id = set_order_status.order_id
    )
    order by v.id
    for update;

    -- Items whose variant was deleted since (variant_id is null) have nothing to return to.
    update public.product_variants v
    set stock = v.stock + i.quantity
    from (
      select oi.variant_id, sum(oi.quantity) as quantity
      from public.order_items oi
      where oi.order_id = set_order_status.order_id and oi.variant_id is not null
      group by oi.variant_id
    ) as i
    where v.id = i.variant_id;
  end if;

  update public.orders o
  set status = new_status
  where o.id = set_order_status.order_id;

  return new_status;
end;
$$;

-- Supabase grants execute on new public functions to anon by default; only signed-in users
-- may call it, and the function itself lets only admins through.
revoke all on function public.set_order_status(uuid, public.order_status, public.order_status)
  from public, anon, authenticated;
grant execute on function public.set_order_status(uuid, public.order_status, public.order_status)
  to authenticated;

-- Admins may read orders, but change them only through functions like the one above, so a
-- direct `update orders set status = 'cancelled'` cannot skip returning stock.
-- (Orders are created by the create-order Edge Function with the service role.)
drop policy "Admins can manage orders" on public.orders;
drop policy "Admins can manage order items" on public.order_items;

create policy "Admins can read orders"
  on public.orders for select
  to authenticated
  using ((select private.is_admin()));

create policy "Admins can read order items"
  on public.order_items for select
  to authenticated
  using ((select private.is_admin()));

revoke insert, update, delete, truncate on public.orders, public.order_items from authenticated;
