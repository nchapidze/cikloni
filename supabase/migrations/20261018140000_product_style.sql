-- Product style (cut), used by the shop catalog filter. The values and their ka/en labels
-- live in one place for both apps: projects/shared/src/lib/models/product-style.ts.

create type public.product_style as enum (
  'bikini', 'hipster', 'boxer', 'brazilian', 'high_waist', 'seamless'
);

alter table public.products add column style public.product_style;

-- Existing products: the launch catalog by slug (see supabase/seed.sql); anything else gets
-- 'bikini' and should be checked in the admin.
update public.products set style = case slug
  when 'floral-bikini'    then 'bikini'
  when 'seamless-hipster' then 'hipster'
  when 'colorful-boxer'   then 'boxer'
  when 'lace-brazilian'   then 'brazilian'
  else 'bikini'
end::public.product_style;

alter table public.products alter column style set not null;

-- save_product (20261018120000) now also saves product ->> 'style'. Same signature, so the
-- execute grants stay as they were.

create or replace function public.save_product(product jsonb, variants jsonb, images jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_id         uuid := (product ->> 'id')::uuid;
  failed_constraint text;
begin
  if not (select private.is_admin()) then
    raise exception using errcode = 'P0001', message = 'FORBIDDEN';
  end if;

  begin
    insert into public.products as p (
      id, slug, name, description, care, price_gel, absorbency, style, sort_order, is_active
    )
    values (
      target_id,
      product ->> 'slug',
      product -> 'name',
      nullif(product -> 'description', 'null'::jsonb),
      nullif(product -> 'care', 'null'::jsonb),
      (product ->> 'price_gel')::numeric,
      (product ->> 'absorbency')::public.absorbency_level,
      (product ->> 'style')::public.product_style,
      coalesce((product ->> 'sort_order')::integer, 0),
      coalesce((product ->> 'is_active')::boolean, false)
    )
    on conflict (id) do update set
      slug        = excluded.slug,
      name        = excluded.name,
      description = excluded.description,
      care        = excluded.care,
      price_gel   = excluded.price_gel,
      absorbency  = excluded.absorbency,
      style       = excluded.style,
      sort_order  = excluded.sort_order,
      is_active   = excluded.is_active;

    -- Variants. Delete first, so a removed color/size can be re-added in the same save.
    delete from public.product_variants v
    where v.product_id = target_id
      and v.id not in (
        select (e ->> 'id')::uuid from jsonb_array_elements(variants) as e
        where e ->> 'id' is not null
      );

    -- Lock the rows being updated (in id order, like create_order) before reading stock.
    perform 1
    from public.product_variants v
    where v.product_id = target_id
    order by v.id
    for update;

    if exists (
      select 1
      from jsonb_to_recordset(variants) as r (id uuid, stock integer, loaded_stock integer)
      join public.product_variants v on v.id = r.id and v.product_id = target_id
      where v.stock + (r.stock - coalesce(r.loaded_stock, v.stock)) < 0
    ) then
      raise exception using errcode = 'P0001', message = 'STOCK_CHANGED';
    end if;

    update public.product_variants v
    set color_id   = r.color_id,
        color_name = r.color_name,
        color_hex  = r.color_hex,
        size       = r.size,
        stock      = v.stock + (r.stock - coalesce(r.loaded_stock, v.stock)),
        sku        = r.sku
    from jsonb_to_recordset(variants) as r (
      id uuid, color_id text, color_name jsonb, color_hex text, size text,
      stock integer, loaded_stock integer, sku text
    )
    where r.id is not null and v.id = r.id and v.product_id = target_id;

    insert into public.product_variants (product_id, color_id, color_name, color_hex, size, stock, sku)
    select target_id, r.color_id, r.color_name, r.color_hex, r.size, r.stock, r.sku
    from jsonb_to_recordset(variants) as r (
      id uuid, color_id text, color_name jsonb, color_hex text, size text, stock integer, sku text
    )
    where r.id is null;

    -- Images. The Storage objects of removed images are deleted by the client afterwards.
    delete from public.product_images i
    where i.product_id = target_id
      and i.id not in (
        select (e ->> 'id')::uuid from jsonb_array_elements(images) as e
        where e ->> 'id' is not null
      );

    update public.product_images i
    set color_id = r.color_id, sort_order = r.sort_order
    from jsonb_to_recordset(images) as r (id uuid, color_id text, sort_order integer)
    where r.id is not null and i.id = r.id and i.product_id = target_id;

    insert into public.product_images (product_id, color_id, storage_path, sort_order)
    select target_id, r.color_id, r.storage_path, r.sort_order
    from jsonb_to_recordset(images) as r (id uuid, color_id text, storage_path text, sort_order integer)
    where r.id is null;
  exception
    when unique_violation then
      get stacked diagnostics failed_constraint = constraint_name;
      raise exception using errcode = 'P0001', message = case failed_constraint
        when 'products_slug_key' then 'SLUG_TAKEN'
        when 'product_variants_sku_key' then 'SKU_TAKEN'
        when 'product_variants_product_id_color_id_size_key' then 'DUPLICATE_VARIANT'
        else 'INVALID_PRODUCT'
      end;
    when check_violation or not_null_violation or invalid_text_representation then
      raise exception using errcode = 'P0001', message = 'INVALID_PRODUCT';
  end;

  return target_id;
end;
$$;
