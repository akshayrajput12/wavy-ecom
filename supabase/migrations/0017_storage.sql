-- =============================================================================
-- 0017 — Storage buckets + policies
--   product-media     PUBLIC   product images/video;       write = catalog.write
--   category-media    PUBLIC   category tiles + banners;   write = catalog.write
--   collection-media  PUBLIC   collection tiles + banners; write = catalog.write
--   content-media     PUBLIC   home sections, blog, pages; write = content.write or blog.write
--   review-media      private  <user_id>/<review_id>/<file>; readable once the review is approved
--   return-evidence   private  <user_id>/<return_id>/<file>; owner + returns.read
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-media',    'product-media',    true,  10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']),
  ('category-media',   'category-media',   true,   5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('collection-media', 'collection-media', true,   5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('content-media',    'content-media',    true,  10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'video/mp4']),
  ('review-media',     'review-media',     false,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('return-evidence',  'return-evidence',  false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do nothing;

-- Public-read / staff-write buckets: one read policy + insert/update/delete gated by permission.
do $$
declare r record;
begin
  for r in select * from (values
      ('product-media',    $p$(select public.has_permission('catalog.write'))$p$),
      ('category-media',   $p$(select public.has_permission('catalog.write'))$p$),
      ('collection-media', $p$(select public.has_permission('catalog.write'))$p$),
      ('content-media',    $p$((select public.has_permission('content.write')) or (select public.has_permission('blog.write')))$p$)
    ) as b(bucket, perm)
  loop
    execute format('create policy %I on storage.objects for select to anon, authenticated using (bucket_id = %L)',
                   r.bucket || ' public read', r.bucket);
    execute format('create policy %I on storage.objects for insert to authenticated with check (bucket_id = %L and %s)',
                   r.bucket || ' staff write', r.bucket, r.perm);
    execute format('create policy %I on storage.objects for update to authenticated using (bucket_id = %L and %s)',
                   r.bucket || ' staff update', r.bucket, r.perm);
    execute format('create policy %I on storage.objects for delete to authenticated using (bucket_id = %L and %s)',
                   r.bucket || ' staff delete', r.bucket, r.perm);
  end loop;
end $$;

-- review-media
create policy "review-media owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "review-media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "review-media staff write" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-media' and (select public.has_permission('reviews.moderate')));
create policy "review-media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'review-media' and (select public.has_permission('reviews.moderate')));
create policy "review-media read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'review-media' and (
         (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.has_permission('reviews.moderate'))
      or exists (select 1 from public.review_media rm join public.reviews r on r.id = rm.review_id
                  where rm.storage_path = name and r.status = 'approved')));

-- return-evidence
create policy "return-evidence owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'return-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "return-evidence read" on storage.objects for select to authenticated
  using (bucket_id = 'return-evidence' and (
         (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.has_permission('returns.read'))));
