create or replace function private.prepare_community_membership()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  selected_community public.communities%rowtype;
  active_count integer;
begin
  select *
    into selected_community
    from public.communities
   where id = new.community_id
   for update;

  if selected_community.id is null then
    raise exception 'La comunidad ya no está disponible';
  end if;

  if new.user_id = auth.uid()
     and exists (
       select 1
         from public.community_members cm
        where cm.community_id = new.community_id
          and cm.user_id = new.user_id
     ) then
    return null;
  end if;

  if not private.is_conecta_verified(true) then
    raise exception 'Debes verificar correo y teléfono antes de unirte';
  end if;

  new.role := 'member';

  if selected_community.auto_approve then
    select count(*)
      into active_count
      from public.community_members cm
     where cm.community_id = new.community_id
       and cm.status = 'active';

    if selected_community.member_limit is not null
       and active_count >= selected_community.member_limit then
      raise exception 'La comunidad está completa';
    end if;

    new.status := 'active';
  else
    new.status := 'requested';
  end if;

  return new;
end;
$function$;
