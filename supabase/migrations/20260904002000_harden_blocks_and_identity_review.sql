create or replace function private.is_conversation_member(conversation_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'private', 'pg_temp'
as $$
  select exists (
    select 1
    from public.conversation_members mine
    join public.conversations c on c.id = mine.conversation_id
    where mine.conversation_id = conversation_uuid
      and mine.user_id = (select auth.uid())
      and (
        c.type <> 'direct'
        or not exists (
          select 1
          from public.conversation_members peer
          where peer.conversation_id = conversation_uuid
            and peer.user_id <> (select auth.uid())
            and private.are_users_blocked(peer.user_id)
        )
      )
  );
$$;

drop policy if exists "connections requester insert" on public.connections;
create policy "connections requester insert"
on public.connections
for insert
to authenticated
with check (
  private.is_conecta_verified(true)
  and requester_id = (select auth.uid())
  and receiver_id <> (select auth.uid())
  and not private.are_users_blocked(receiver_id)
);

drop policy if exists "connections receiver update" on public.connections;
create policy "connections receiver update"
on public.connections
for update
to authenticated
using (
  private.is_conecta_verified(true)
  and receiver_id = (select auth.uid())
  and not private.are_users_blocked(requester_id)
)
with check (
  private.is_conecta_verified(true)
  and receiver_id = (select auth.uid())
  and not private.are_users_blocked(requester_id)
);

drop policy if exists "plans verified read" on public.plans;
create policy "plans verified read"
on public.plans
for select
to authenticated
using (
  private.is_conecta_verified(false)
  and (
    creator_id = (select auth.uid())
    or (
      not private.are_users_blocked(creator_id)
      and (
        visibility = 'public'
        or private.is_plan_member(id)
        or (visibility = 'connections' and private.are_users_connected(creator_id))
      )
    )
  )
);

drop policy if exists "identity staff read" on public.identity_verifications;
create policy "identity staff read"
on public.identity_verifications
for select
to authenticated
using (private.is_conecta_staff());

drop policy if exists "identity staff update" on public.identity_verifications;
create policy "identity staff update"
on public.identity_verifications
for update
to authenticated
using (private.is_conecta_staff())
with check (private.is_conecta_staff());

drop policy if exists "identity storage staff read" on storage.objects;
create policy "identity storage staff read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'identity-video'
  and private.is_conecta_staff()
);

drop policy if exists "identity storage owner delete" on storage.objects;
create policy "identity storage owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'identity-video'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
