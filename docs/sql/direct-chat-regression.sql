begin;
select set_config('conecta.audit.a',gen_random_uuid()::text,true),set_config('conecta.audit.b',gen_random_uuid()::text,true),set_config('conecta.audit.c',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,aud,role)
select current_setting(k)::uuid,'conecta-audit-'||current_setting(k)||'@example.invalid',now(),'{}','{}','authenticated','authenticated' from unnest(array['conecta.audit.a','conecta.audit.b','conecta.audit.c']) k;
update public.profiles set allow_messages='everyone' where id in(current_setting('conecta.audit.a')::uuid,current_setting('conecta.audit.b')::uuid);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.a'),'role','authenticated')::text,true);
set local role authenticated;

select set_config('conecta.audit.conv',public.get_or_create_direct_conversation(current_setting('conecta.audit.b')::uuid)::text,true);
do $$ begin
if public.get_or_create_direct_conversation(current_setting('conecta.audit.b')::uuid)::text<>current_setting('conecta.audit.conv') then raise exception 'duplicate chat'; end if;
if (select count(*) from public.conversation_members where conversation_id=current_setting('conecta.audit.conv')::uuid)<>2 then raise exception 'membership incomplete'; end if;
begin perform public.get_or_create_direct_conversation(auth.uid()); raise exception 'self accepted'; exception when insufficient_privilege then null; end;
begin perform public.get_or_create_direct_conversation(current_setting('conecta.audit.c')::uuid); raise exception 'connection privacy ignored'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.b'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
if public.get_or_create_direct_conversation(current_setting('conecta.audit.a')::uuid)::text<>current_setting('conecta.audit.conv') then raise exception 'reverse duplicate'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.c'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
if exists(select 1 from public.conversations where id=current_setting('conecta.audit.conv')::uuid) then raise exception 'outsider read'; end if;
begin
insert into public.messages(conversation_id,sender_id,content,kind) values(current_setting('conecta.audit.conv')::uuid,auth.uid(),'audit only','text');
raise exception 'outsider write';
exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.a'),'role','authenticated')::text,true);
insert into public.connections(requester_id,receiver_id,status) values(current_setting('conecta.audit.a')::uuid,current_setting('conecta.audit.c')::uuid,'accepted');
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.a'),'role','authenticated')::text,true);
set local role authenticated;
select set_config('conecta.audit.connected',public.get_or_create_direct_conversation(current_setting('conecta.audit.c')::uuid)::text,true);
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.b'),'role','authenticated')::text,true);
insert into public.blocks(blocker_id,blocked_id) values(current_setting('conecta.audit.b')::uuid,current_setting('conecta.audit.a')::uuid);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.a'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
begin perform public.get_or_create_direct_conversation(current_setting('conecta.audit.b')::uuid); raise exception 'reverse block ignored'; exception when insufficient_privilege then null; end;
if exists(select 1 from public.conversations where id=current_setting('conecta.audit.conv')::uuid) then raise exception 'blocked chat visible'; end if;
end $$;
reset role;
delete from public.blocks where blocker_id=current_setting('conecta.audit.b')::uuid and blocked_id=current_setting('conecta.audit.a')::uuid;
insert into public.blocks(blocker_id,blocked_id) values(current_setting('conecta.audit.a')::uuid,current_setting('conecta.audit.b')::uuid);
set local role authenticated;
do $$ begin
begin perform public.get_or_create_direct_conversation(current_setting('conecta.audit.b')::uuid); raise exception 'forward block ignored'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update public.profiles set allow_messages='nobody' where id=current_setting('conecta.audit.b')::uuid;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.c'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
begin perform public.get_or_create_direct_conversation(current_setting('conecta.audit.b')::uuid); raise exception 'nobody ignored'; exception when insufficient_privilege then null; end;
end $$;
reset role;
update auth.users set email_confirmed_at=null where id=current_setting('conecta.audit.a')::uuid;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.a'),'role','authenticated')::text,true);
set local role authenticated;
do $$ begin
begin perform public.get_or_create_direct_conversation(current_setting('conecta.audit.c')::uuid); raise exception 'unverified accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$ begin
begin perform public.get_or_create_direct_conversation(current_setting('conecta.audit.b')::uuid); raise exception 'anon accepted'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select json_build_object('atomic_creation',true,'idempotent_both_directions',true,'exact_membership',true,'connections_privacy',true,'connected_allowed',true,'nobody_denied',true,'blocks_both_directions',true,'outsider_read_write_denied',true,'unverified_denied',true,'anonymous_denied',true) as passed;
rollback;
