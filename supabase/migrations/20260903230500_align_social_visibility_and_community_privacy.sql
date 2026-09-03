-- CONECTA social visibility + community privacy alignment
-- Keeps UI visibility semantics consistent with live RLS rules.

create or replace function private.are_users_connected(other_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select other_user is not null
    and other_user <> (select auth.uid())
    and not private.are_users_blocked(other_user)
    and exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = (select auth.uid()) and c.receiver_id = other_user)
          or
          (c.receiver_id = (select auth.uid()) and c.requester_id = other_user)
        )
    );
$$;

grant execute on function private.are_users_connected(uuid) to authenticated;

create or replace function private.is_community_member(target_community uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.community_members cm
    where cm.community_id = target_community
      and cm.user_id = (select auth.uid())
      and cm.status = 'active'
  );
$$;

grant execute on function private.is_community_member(uuid) to authenticated;

drop policy if exists "plans verified read" on public.plans;
create policy "plans verified read"
on public.plans
for select
to authenticated
using (
  private.is_conecta_verified(false)
  and (
    visibility = 'public'
    or creator_id = (select auth.uid())
    or private.is_plan_member(id)
    or (visibility = 'connections' and private.are_users_connected(creator_id))
  )
);

drop policy if exists "communities verified read" on public.communities;
create policy "communities verified read"
on public.communities
for select
to authenticated
using (
  private.is_conecta_verified(false)
  and (
    visibility = 'public'
    or owner_id = (select auth.uid())
    or private.is_community_member(id)
    or (visibility = 'connections' and private.are_users_connected(owner_id))
  )
);

drop policy if exists "community members verified read" on public.community_members;
create policy "community members verified read"
on public.community_members
for select
to authenticated
using (
  private.is_conecta_verified(false)
  and (
    user_id = (select auth.uid())
    or private.is_community_manager(community_id)
    or private.is_community_member(community_id)
    or exists (
      select 1
      from public.communities c
      where c.id = community_members.community_id
        and c.visibility = 'public'
    )
  )
);
