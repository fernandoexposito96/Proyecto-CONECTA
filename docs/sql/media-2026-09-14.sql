ALTER POLICY profile_media_public_read ON public.profile_media TO authenticated
USING (user_id=(select auth.uid()) OR EXISTS(select 1 from public.profiles p where p.id=user_id));
ALTER POLICY profile_media_owner_insert ON public.profile_media
WITH CHECK (user_id=(select auth.uid()) AND split_part(storage_path,'/',1)=(select auth.uid())::text);
ALTER POLICY profile_media_storage_owner_select ON storage.objects
USING (bucket_id='profile-media' AND (
  (storage.foldername(name))[1]=(select auth.uid())::text
  OR EXISTS(select 1 from public.profile_media m where m.storage_path=name)
));
UPDATE storage.buckets SET public=false WHERE id='profile-media';
