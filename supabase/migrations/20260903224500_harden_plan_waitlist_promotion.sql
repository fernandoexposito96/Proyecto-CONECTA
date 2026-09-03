create or replace function private.promote_plan_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  target_plan uuid;
  p public.plans%rowtype;
  occupied integer;
  next_user uuid;
begin
  target_plan := coalesce(old.plan_id, new.plan_id);

  select * into p
  from public.plans
  where id = target_plan
  for update;

  if not found or p.max_people is null then
    return coalesce(new, old);
  end if;

  select count(*) into occupied
  from public.plan_members
  where plan_id = target_plan
    and status in ('attending', 'attended');

  if occupied >= p.max_people then
    return coalesce(new, old);
  end if;

  select user_id into next_user
  from public.plan_members
  where plan_id = target_plan
    and status = 'waitlist'
  order by joined_at asc
  limit 1
  for update skip locked;

  if next_user is null then
    return coalesce(new, old);
  end if;

  update public.plan_members
  set status = 'attending', confirmed_at = now(), updated_at = now()
  where plan_id = target_plan
    and user_id = next_user
    and status = 'waitlist';

  if found then
    insert into public.notifications(user_id, type, title, body, entity_type, entity_id)
    values(next_user, 'waitlist_promoted', '¡Tienes plaza!', 'Se ha liberado una plaza y ya estás dentro del plan.', 'plan', target_plan);
  end if;

  return coalesce(new, old);
end;
$$;