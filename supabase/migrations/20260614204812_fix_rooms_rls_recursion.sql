-- Fix RLS recursion between rooms <-> room_participants.
--
-- Previous policy graph caused a cycle:
-- rooms_select_member -> room_participants -> room_participants_select_member -> rooms
-- which can trigger "infinite recursion detected in policy for relation rooms".

alter policy "room_participants_select_member"
  on public.room_participants
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = room_participants.room_id and rp.user_id = auth.uid()
    )
  );
