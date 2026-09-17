-- Atomic direct-chat creation. No broader table/RLS grants.
create or replace function private.get_or_create_direct_conversation(other_user uuid)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare me uuid := auth.uid(); conv uuid; permission text;
begin
  if me is null or other_user is null or me = other_user
     or not coalesce(private.is_conecta_verified(true),false) then
    raise exception 'invalid conversation participant' using errcode='42501';
  end if;
  if private.are_users_blocked(other_user) then
    raise exception 'conversation unavailable' using errcode='42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    least(me::text,other_user::text)||':'||greatest(me::text,other_user::text),0));
  select c.id into conv from public.conversations c
  join public.conversation_members a on a.conversation_id=c.id and a.user_id=me
  join public.conversation_members b on b.conversation_id=c.id and b.user_id=other_user
  where c.type='direct' and (select count(*) from public.conversation_members cm where cm.conversation_id=c.id)=2
  order by c.created_at,c.id limit 1;
  if conv is not null then return conv; end if;
  select p.allow_messages into permission from public.profiles p where p.id=other_user;
  if permission is null or permission='nobody'
     or (permission='connections' and not private.are_users_connected(other_user)) then
    raise exception 'conversation unavailable' using errcode='42501';
  end if;
  insert into public.conversations(type,created_by) values('direct',me) returning id into conv;
  insert into public.conversation_members(conversation_id,user_id) values(conv,me),(conv,other_user);
  return conv;
end;
$$;
revoke all on function private.get_or_create_direct_conversation(uuid) from public,anon;
grant execute on function private.get_or_create_direct_conversation(uuid) to authenticated;
create or replace function public.get_or_create_direct_conversation(other_user uuid)
returns uuid language sql security invoker set search_path=''
as $$ select private.get_or_create_direct_conversation(other_user); $$;
revoke all on function public.get_or_create_direct_conversation(uuid) from public,anon;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
