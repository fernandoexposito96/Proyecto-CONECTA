CREATE OR REPLACE FUNCTION public.accept_plan_invite(p_code text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := auth.uid();
  v_plan uuid;
  v_existing_invitee uuid;
  v_creator uuid;
  v_current_status text;
begin
  if v_user is null then
    raise exception 'authentication required';
  end if;
  if not private.is_conecta_verified(false) then
    raise exception 'verified email required';
  end if;

  select i.plan_id,i.invitee_id,p.creator_id
    into v_plan,v_existing_invitee,v_creator
  from public.plan_invites i
  join public.plans p on p.id=i.plan_id
  where i.invite_code=p_code
    and p.status in ('published','full')
  limit 1 for update of i;

  if v_plan is null then
    raise exception 'invite not found';
  end if;
  if private.are_users_blocked(v_creator) then
    raise exception 'invite unavailable' using errcode='42501';
  end if;
  if v_existing_invitee is not null and v_existing_invitee<>v_user then
    raise exception 'invite already used';
  end if;

  select status into v_current_status
  from public.plan_members
  where plan_id=v_plan and user_id=v_user;

  if v_current_status is not null
     and v_current_status not in ('attending','attended','requested','waitlist') then
    delete from public.plan_members
    where plan_id=v_plan and user_id=v_user;
    v_current_status := null;
  end if;

  if v_current_status is null then
    insert into public.plan_members(plan_id,user_id,status,role)
    values(v_plan,v_user,'attending','participant');
  end if;

  select status into v_current_status
  from public.plan_members
  where plan_id=v_plan and user_id=v_user;

  update public.plan_invites
  set invitee_id=v_user
  where invite_code=p_code and (invitee_id is null or invitee_id=v_user);

  if v_current_status in ('attending','attended') then
    insert into public.conversation_members(conversation_id,user_id)
    select c.id,v_user
    from public.conversations c
    where c.plan_id=v_plan
    on conflict do nothing;
  else
    delete from public.conversation_members cm
    using public.conversations c
    where c.id=cm.conversation_id
      and c.plan_id=v_plan
      and cm.user_id=v_user;
  end if;

  return v_plan;
end;
$function$;

CREATE OR REPLACE FUNCTION private.sync_plan_conversation_member()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  target_conversation_id uuid;
begin
  if tg_op = 'DELETE' then
    select c.id into target_conversation_id from public.conversations c where c.plan_id = old.plan_id;
  else
    select c.id into target_conversation_id from public.conversations c where c.plan_id = new.plan_id;
  end if;

  if target_conversation_id is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    delete from public.conversation_members cm
    where cm.conversation_id = target_conversation_id and cm.user_id = old.user_id;
  elsif new.status not in ('attending','attended') then
    delete from public.conversation_members cm
    where cm.conversation_id = target_conversation_id and cm.user_id = new.user_id;
  elsif new.status in ('attending','attended') then
    insert into public.conversation_members (conversation_id, user_id)
    values (target_conversation_id, new.user_id)
    on conflict do nothing;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$;
