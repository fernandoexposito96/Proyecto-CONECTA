-- Membership RPCs must use the caller's RLS permissions.
-- Existing triggers remain responsible for capacity, approval and waitlist promotion.
create or replace function public.join_plan_atomic(p_plan_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_user uuid := auth.uid();
  v_status text;
begin
  if v_user is null then raise exception 'authentication required' using errcode='42501'; end if;
  perform 1 from public.plans where id=p_plan_id and status in ('published','full');
  if not found then raise exception 'plan unavailable' using errcode='42501'; end if;

  select status into v_status from public.plan_members where plan_id=p_plan_id and user_id=v_user;
  if v_status in ('attending','requested','waitlist','attended') then return v_status; end if;
  if v_status is not null then raise exception 'membership requires organizer review' using errcode='42501'; end if;

  insert into public.plan_members(plan_id,user_id,status,role)
  values(p_plan_id,v_user,'attending','participant')
  on conflict(plan_id,user_id) do nothing
  returning status into v_status;

  if v_status is null then
    select status into v_status from public.plan_members where plan_id=p_plan_id and user_id=v_user;
  end if;
  if v_status is null then raise exception 'membership unavailable' using errcode='42501'; end if;
  return v_status;
end;
$function$;

create or replace function public.leave_plan_atomic(p_plan_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode='42501'; end if;
  delete from public.plan_members where plan_id=p_plan_id and user_id=auth.uid();
  return 'left';
end;
$function$;

revoke all on function public.join_plan_atomic(uuid) from public, anon;
revoke all on function public.leave_plan_atomic(uuid) from public, anon;
grant execute on function public.join_plan_atomic(uuid) to authenticated;
grant execute on function public.leave_plan_atomic(uuid) to authenticated;
