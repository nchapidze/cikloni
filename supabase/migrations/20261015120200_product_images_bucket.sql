-- Public bucket for product photos. "public = true" serves files by their public URL
-- without any policy; writing still goes through storage.objects RLS below.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
);

-- Admins need select too: the Storage API reads the row back on update, upsert and delete.
create policy "Admins can read product image objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));

create policy "Admins can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "Admins can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "Admins can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
