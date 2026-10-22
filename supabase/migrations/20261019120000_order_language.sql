-- The site language the customer ordered in, so emails about the order use it.
-- Existing orders were all placed before English emails existed: they default to Georgian.

alter table public.orders
  add column language text not null default 'ka' check (language in ('ka', 'en'));

-- create_order gains an `order_language` parameter and returns the order id (the create-order
-- Edge Function uses it for the admin link in the notification email and does not pass it on).
-- Otherwise unchanged from 20261017130000_create_order_function.sql.
drop function public.create_order(jsonb, jsonb, text, numeric, text);

create function public.create_order(
  customer         jsonb,
  items            jsonb,
  delivery_method  text,
  delivery_fee_gel numeric,
  payment_method   text,
  order_language   text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  requested jsonb;
  problems  jsonb;
  subtotal  numeric(10, 2);
  new_order public.orders;
begin
  if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items) = 0 then
    raise exception using errcode = 'P0001', message = 'EMPTY_ORDER';
  end if;

  -- One entry per variant: [{ "variant_id", "quantity" }].
  select jsonb_agg(jsonb_build_object('variant_id', variant_id, 'quantity', quantity))
  into requested
  from (
    select (e ->> 'variantId')::uuid as variant_id, sum((e ->> 'quantity')::integer) as quantity
    from jsonb_array_elements(items) as e
    group by 1
  ) as merged;

  -- Lock the variants (in id order, so concurrent checkouts cannot deadlock). Stock cannot
  -- change under us from here until commit.
  perform 1
  from public.product_variants v
  where v.id in (select r.variant_id from jsonb_to_recordset(requested) as r (variant_id uuid))
  order by v.id
  for update;

  select coalesce(
    jsonb_agg(jsonb_build_object(
      'variantId', r.variant_id,
      'available', case when p.is_active and p.price_gel is not null then v.stock else 0 end
    )),
    '[]'::jsonb
  )
  into problems
  from jsonb_to_recordset(requested) as r (variant_id uuid, quantity integer)
  left join public.product_variants v on v.id = r.variant_id
  left join public.products p on p.id = v.product_id
  where v.id is null
     or not p.is_active
     or p.price_gel is null
     or v.stock < r.quantity;

  if jsonb_array_length(problems) > 0 then
    raise exception using errcode = 'P0001', message = 'OUT_OF_STOCK', detail = problems::text;
  end if;

  select sum(p.price_gel * r.quantity)
  into subtotal
  from jsonb_to_recordset(requested) as r (variant_id uuid, quantity integer)
  join public.product_variants v on v.id = r.variant_id
  join public.products p on p.id = v.product_id;

  insert into public.orders (
    customer_name, phone, email, city, address, notes,
    delivery_method, payment_method, subtotal_gel, delivery_fee_gel, total_gel, language
  )
  values (
    customer ->> 'name',
    customer ->> 'phone',
    nullif(customer ->> 'email', ''),
    customer ->> 'city',
    customer ->> 'address',
    nullif(customer ->> 'notes', ''),
    delivery_method,
    payment_method,
    subtotal,
    delivery_fee_gel,
    subtotal + delivery_fee_gel,
    order_language
  )
  returning * into new_order;

  insert into public.order_items (
    order_id, variant_id, product_name, color_name, size, unit_price_gel, quantity
  )
  select new_order.id, v.id, p.name, v.color_name, v.size, p.price_gel, r.quantity
  from jsonb_to_recordset(requested) as r (variant_id uuid, quantity integer)
  join public.product_variants v on v.id = r.variant_id
  join public.products p on p.id = v.product_id;

  update public.product_variants v
  set stock = v.stock - r.quantity
  from jsonb_to_recordset(requested) as r (variant_id uuid, quantity integer)
  where v.id = r.variant_id;

  return jsonb_build_object(
    'orderId', new_order.id,
    'orderNumber', new_order.order_number,
    'subtotalGel', new_order.subtotal_gel,
    'deliveryFeeGel', new_order.delivery_fee_gel,
    'totalGel', new_order.total_gel,
    'city', new_order.city,
    'items', (
      select jsonb_agg(jsonb_build_object(
        'productName', oi.product_name,
        'colorName', oi.color_name,
        'size', oi.size,
        'unitPriceGel', oi.unit_price_gel,
        'quantity', oi.quantity
      ) order by oi.id)
      from public.order_items oi
      where oi.order_id = new_order.id
    )
  );
end;
$$;

-- Not callable through the public API: Supabase grants execute on new public functions to
-- anon and authenticated by default, so revoke explicitly.
revoke all on function public.create_order(jsonb, jsonb, text, numeric, text, text)
  from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb, text, numeric, text, text)
  to service_role;
