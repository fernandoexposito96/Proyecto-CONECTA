alter policy "events owner update" on public.events
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

alter policy "notifications own update" on public.notifications
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "posts owner update" on public.posts
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

alter policy "trips owner update" on public.trips
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));
