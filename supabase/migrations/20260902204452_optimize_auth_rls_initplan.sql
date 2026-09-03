alter policy "analytics_events_insert_own" on public.analytics_events
  with check ((user_id is null) or (user_id = (select auth.uid())));

alter policy "client_error_events_insert_own" on public.client_error_events
  with check ((user_id is null) or (user_id = (select auth.uid())));
