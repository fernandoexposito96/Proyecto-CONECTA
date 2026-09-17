begin;

select set_config('conecta.audit.owner',gen_random_uuid()::text,true),set_config('conecta.audit.peer',gen_random_uuid()::text,true),set_config('conecta.audit.third',gen_random_uuid()::text,true),set_config('conecta.audit.fourth',gen_random_uuid()::text,true),set_config('conecta.audit.hidden',gen_random_uuid()::text,true),set_config('conecta.audit.manual',gen_random_uuid()::text,true),set_config('conecta.audit.auto',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,aud,role)
select current_setting('conecta.audit.'||name)::uuid,'conecta-audit-'||current_setting('conecta.audit.'||name)||'@example.invalid',now(),'{}','{}','authenticated','authenticated' from unnest(array['owner','peer','third','fourth']) as name;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.owner'),'role','authenticated')::text,true);
set local role authenticated;
insert into public.plans(id,creator_id,title,visibility,status,starts_at,approval_mode,max_people)
values
(current_setting('conecta.audit.hidden')::uuid,auth.uid(),'Transactional hidden test','connections','published',now()+interval '1 day','automatic',2),
(current_setting('conecta.audit.manual')::uuid,auth.uid(),'Transactional manual test','public','published',now()+interval '1 day','manual',2),
(current_setting('conecta.audit.auto')::uuid,auth.uid(),'Transactional capacity test','public','published',now()+interval '1 day','automatic',2);
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.peer'),'role','authenticated')::text,true);
set local role authenticated;

do $test$
begin
  begin
    perform public.join_plan_atomic(current_setting('conecta.audit.hidden')::uuid);
    raise exception 'TEST FAILED: hidden plan accepted';
  exception when insufficient_privilege then null; end;
  if public.join_plan_atomic(current_setting('conecta.audit.manual')::uuid)<>'requested' then raise exception 'TEST FAILED: manual status'; end if;
  if public.join_plan_atomic(current_setting('conecta.audit.manual')::uuid)<>'requested' then raise exception 'TEST FAILED: repeated manual join'; end if;
  if public.join_plan_atomic(current_setting('conecta.audit.auto')::uuid)<>'attending' then raise exception 'TEST FAILED: public join'; end if;
  if public.join_plan_atomic(current_setting('conecta.audit.auto')::uuid)<>'attending' then raise exception 'TEST FAILED: duplicate join'; end if;
end;
$test$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.third'),'role','authenticated')::text,true);
set local role authenticated;
do $test$ begin
  if public.join_plan_atomic(current_setting('conecta.audit.auto')::uuid)<>'attending' then raise exception 'TEST FAILED: second place'; end if;
end; $test$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.fourth'),'role','authenticated')::text,true);
set local role authenticated;
do $test$ begin
  if public.join_plan_atomic(current_setting('conecta.audit.auto')::uuid)<>'waitlist' then raise exception 'TEST FAILED: capacity exceeded'; end if;
end; $test$;
reset role;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('conecta.audit.third'),'role','authenticated')::text,true);
set local role authenticated;
do $test$ begin
  if public.leave_plan_atomic(current_setting('conecta.audit.auto')::uuid)<>'left' then raise exception 'TEST FAILED: leave'; end if;
  if exists(select 1 from public.plan_members where plan_id=current_setting('conecta.audit.auto')::uuid and user_id=auth.uid()) then raise exception 'TEST FAILED: membership remains'; end if;
end; $test$;
reset role;
do $test$ begin
  if (select status from public.plan_members where plan_id=current_setting('conecta.audit.auto')::uuid and user_id=current_setting('conecta.audit.fourth')::uuid)<>'attending' then raise exception 'TEST FAILED: waitlist not promoted'; end if;
  if (select count(*) from public.plan_members where plan_id=current_setting('conecta.audit.auto')::uuid and status='attending')<>2 then raise exception 'TEST FAILED: incorrect capacity after promotion'; end if;
end; $test$;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $test$ begin
  begin
    perform public.join_plan_atomic(current_setting('conecta.audit.auto')::uuid);
    raise exception 'TEST FAILED: anonymous join';
  exception when insufficient_privilege then null; end;
  begin
    perform public.leave_plan_atomic(current_setting('conecta.audit.auto')::uuid);
    raise exception 'TEST FAILED: anonymous leave';
  exception when insufficient_privilege then null; end;
end; $test$;
reset role;
select json_build_object('hidden_plan_denied',true,'manual_status_requested',true,'idempotent_join',true,'public_join',true,'capacity_enforced',true,'waitlist_promoted',true,'self_leave',true,'anonymous_rpcs_denied',true) as assertions;
rollback;
