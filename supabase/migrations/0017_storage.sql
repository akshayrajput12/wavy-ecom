-- =============================================================================
-- 0017 — Storage buckets + policies
--   product-media    PUBLIC   catalog images; write = catalog.write
--   review-media     private  <user_id>/<review_id>/<file>; readable once the review is approved
--   tryon-private    private  <user_id>/<session_id>/<file>; owner only (anonymous try-on via
--                             backend signed URLs). Staff never see try-on photos.
--   return-evidence  private  <user_id>/<return_id>/<file>; owner + returns.read
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-media',   'product-media',   true,  10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4']),
  ('review-media',    'review-media',    false,  5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('tryon-private',   'tryon-private',   false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('return-evidence', 'return-evidence', false, 26214400, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do nothing;

-- product-media
create policy "product-media public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-media');
create policy "product-media staff write" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-media' and (select public.has_permission('catalog.write')));
create policy "product-media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'product-media' and (select public.has_permission('catalog.write')));
create policy "product-media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-media' and (select public.has_permission('catalog.write')));

-- review-media
create policy "review-media owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "review-media owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'review-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "review-media read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'review-media' and (
         (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.has_permission('reviews.moderate'))
      or exists (select 1 from public.review_media rm join public.reviews r on r.id = rm.review_id
                  where rm.storage_path = name and r.status = 'approved')));

-- tryon-private (owner only)
create policy "tryon owner read" on storage.objects for select to authenticated
  using (bucket_id = 'tryon-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "tryon owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'tryon-private' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "tryon owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'tryon-private' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- return-evidence
create policy "return-evidence owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'return-evidence' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "return-evidence read" on storage.objects for select to authenticated
  using (bucket_id = 'return-evidence' and (
         (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.has_permission('returns.read'))));
