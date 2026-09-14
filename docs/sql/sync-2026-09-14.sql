CREATE OR REPLACE FUNCTION public.merge_my_prototype_state(p_patch jsonb, p_expected_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or auth.uid() is distinct from p_expected_user then
    raise exception 'Session changed' using errcode='42501';
  end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or exists (
    select 1 from jsonb_object_keys(p_patch) k where k not like 'conecta-%' or k='conecta-auth-user-v1'
  ) then
    raise exception 'Invalid state patch' using errcode='22023';
  end if;
  insert into public.prototype_state(user_id,state,updated_at)
  values(auth.uid(),p_patch,now())
  on conflict(user_id) do update
  set state=coalesce(public.prototype_state.state,'{}'::jsonb)||excluded.state,updated_at=now();
end;
$function$;
REVOKE ALL ON FUNCTION public.merge_my_prototype_state(jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.merge_my_prototype_state(jsonb,uuid) TO authenticated;
UPDATE storage.buckets SET allowed_mime_types=ARRAY['video/webm','video/mp4','image/jpeg','image/png','image/webp','image/heic','image/heif'] WHERE id='identity-video';
