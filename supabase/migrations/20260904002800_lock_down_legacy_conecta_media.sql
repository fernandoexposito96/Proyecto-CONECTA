update storage.buckets
set public = false,
    file_size_limit = 12582912,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[]
where id = 'conecta-media';

drop policy if exists "    Authenticated users update media 1e4fx9g_0" on storage.objects;
drop policy if exists "    Authenticated users update media 1e4fx9g_1" on storage.objects;
drop policy if exists "    Authenticated users upload media 1e4fx9g_0" on storage.objects;
drop policy if exists "Authenticated users delete media 1e4fx9g_0" on storage.objects;
drop policy if exists "Authenticated users delete media 1e4fx9g_1" on storage.objects;
drop policy if exists "conecta_media_delete" on storage.objects;
drop policy if exists "conecta_media_insert" on storage.objects;
drop policy if exists "conecta_media_select" on storage.objects;
drop policy if exists "conecta_media_update" on storage.objects;

create policy "conecta media owner insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'conecta-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "conecta media owner read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'conecta-media'
  and owner_id = (select auth.uid())::text
);

create policy "conecta media owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'conecta-media'
  and owner_id = (select auth.uid())::text
)
with check (
  bucket_id = 'conecta-media'
  and owner_id = (select auth.uid())::text
);

create policy "conecta media owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'conecta-media'
  and owner_id = (select auth.uid())::text
);
