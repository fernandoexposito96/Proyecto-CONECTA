-- Keep the private plan authorization helper callable only by privileged database roles.
-- Public RPC wrappers call private core functions, which in turn use this helper internally.
revoke execute on function private.is_plan_manager(uuid) from authenticated, anon;
