-- Remove residual policy recursion risk on room_participants.
-- Keep access model simple: users can read their own participant rows.

alter policy "room_participants_select_member"
  on public.room_participants
  using (user_id = auth.uid());
