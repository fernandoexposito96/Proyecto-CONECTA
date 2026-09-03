-- CONECTA runtime performance indexes
-- Safe, idempotent indexes aligned with the application's hottest read paths.

create index if not exists plans_status_starts_at_idx
  on public.plans (status, starts_at);

create index if not exists plans_expires_at_idx
  on public.plans (expires_at)
  where expires_at is not null;

create index if not exists plan_members_plan_joined_idx
  on public.plan_members (plan_id, joined_at desc);

create index if not exists plan_members_user_plan_idx
  on public.plan_members (user_id, plan_id);

create index if not exists community_members_community_joined_idx
  on public.community_members (community_id, joined_at desc);

create index if not exists community_members_user_community_idx
  on public.community_members (user_id, community_id);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists saved_items_user_type_item_idx
  on public.saved_items (user_id, item_type, item_id);

create index if not exists connections_requester_created_idx
  on public.connections (requester_id, created_at desc);

create index if not exists connections_receiver_created_idx
  on public.connections (receiver_id, created_at desc);

create index if not exists conversations_created_idx
  on public.conversations (created_at desc);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

create index if not exists message_reads_user_message_idx
  on public.message_reads (user_id, message_id);
