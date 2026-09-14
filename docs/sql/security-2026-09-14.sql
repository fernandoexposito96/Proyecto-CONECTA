-- Authorization fixes; no tables, columns or demo data are changed.
CREATE OR REPLACE FUNCTION private.protect_profile_identity_status()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path TO ''
AS $function$
begin
  if new.identity_status is distinct from old.identity_status
     or new.organizer_verified is distinct from old.organizer_verified then
    if coalesce((select auth.role()), '') <> 'service_role'
       and current_user not in ('postgres','supabase_admin') then
      raise exception 'Verification fields are managed by CONECTA' using errcode='42501';
    end if;
  end if;
  return new;
end;
$function$;

ALTER POLICY "plan members join self" ON public.plan_members
WITH CHECK (
  private.is_conecta_verified(true)
  AND user_id = (select auth.uid()) AND role='participant'
  AND EXISTS (select 1 from public.plans p where p.id=plan_id AND p.status in ('published','full'))
);

ALTER POLICY "connections requester insert" ON public.connections
WITH CHECK (
  private.is_conecta_verified(true)
  AND requester_id=(select auth.uid()) AND receiver_id<>(select auth.uid())
  AND status='pending'
  AND NOT private.are_users_blocked(receiver_id)
);

ALTER POLICY "messages sender update" ON public.messages
USING (
  private.is_conecta_verified(true) AND sender_id=(select auth.uid())
  AND private.is_conversation_member(conversation_id)
)
WITH CHECK (
  private.is_conecta_verified(true) AND sender_id=(select auth.uid())
  AND private.is_conversation_member(conversation_id)
  AND private.conversation_accepts_messages(conversation_id)
);
