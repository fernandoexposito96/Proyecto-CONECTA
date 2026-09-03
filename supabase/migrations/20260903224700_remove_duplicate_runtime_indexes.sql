-- CONECTA: remove indexes that duplicate existing production indexes.
-- Existing equivalents kept in place:
--   idx_messages_conversation_created
--   idx_notifications_user_created

drop index if exists public.messages_conversation_created_idx;
drop index if exists public.notifications_user_created_idx;
