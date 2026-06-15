-- Allow room owners/participants to write call session lifecycle rows.

create policy "call_sessions_insert_owner" on public.call_sessions
  for insert with check (
    exists (
      select 1 from public.rooms r
      where r.id = call_sessions.room_id and r.owner_id = auth.uid()
    )
  );

create policy "call_sessions_update_member" on public.call_sessions
  for update using (
    exists (
      select 1 from public.rooms r
      where r.id = call_sessions.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = call_sessions.room_id and rp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.rooms r
      where r.id = call_sessions.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = call_sessions.room_id and rp.user_id = auth.uid()
    )
  );
