begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,aud,role) values ('10000000-0000-4000-8000-000000000014','conecta-audit-owner-20260914@example.invalid',now(),'{}','{}','authenticated','authenticated'),('20000000-0000-4000-8000-000000000014','conecta-audit-peer-20260914@example.invalid',now(),'{}','{}','authenticated','authenticated');
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000014","role":"authenticated"}',true); set local role authenticated;
insert into public.plans(id,creator_id,title,visibility,starts_at) values ('30000000-0000-4000-8000-000000000014','10000000-0000-4000-8000-000000000014','Conecta transactional access test','connections',now()+interval '1 day');
reset role; select set_config('request.jwt.claims','{"sub":"20000000-0000-4000-8000-000000000014","role":"authenticated"}',true); set local role authenticated;
do $test$
begin
  begin
    update public.profiles set identity_status='verified' where id=auth.uid();
    raise exception 'TEST FAILED: self verification allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set organizer_verified=true where id=auth.uid();
    raise exception 'TEST FAILED: organizer verification allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.plan_members(plan_id,user_id,role,status) values ('30000000-0000-4000-8000-000000000014',auth.uid(),'participant','attending');
    raise exception 'TEST FAILED: hidden plan membership allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.connections(requester_id,receiver_id,status) values (auth.uid(),'10000000-0000-4000-8000-000000000014','accepted');
    raise exception 'TEST FAILED: unilateral accepted connection allowed';
  exception when insufficient_privilege then null; end;
  update public.profiles set display_name='Audit harmless edit' where id=auth.uid();
  insert into public.connections(requester_id,receiver_id,status) values (auth.uid(),'10000000-0000-4000-8000-000000000014','pending');
end;
$test$;
reset role;
select json_build_object('self_verification_blocked',true,'organizer_verification_blocked',true,'hidden_plan_join_blocked',true,'unilateral_connection_blocked',true,'normal_profile_edit_and_request_allowed',true) as assertions;
rollback;
