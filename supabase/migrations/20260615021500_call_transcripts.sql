-- Persisted call captions/transcripts, retained for 30 days.
-- Each speaker writes their own final caption lines; room members can read all
-- lines for rooms they belong to. Translations are derived on read.

create table if not exists public.call_transcripts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  speaker_id uuid not null references auth.users (id) on delete cascade,
  speaker_name text not null default '',
  original_text text not null,
  source_language text not null,
  created_at timestamptz not null default now()
);

create index if not exists call_transcripts_room_created_idx
  on public.call_transcripts (room_id, created_at);

alter table public.call_transcripts enable row level security;

drop policy if exists call_transcripts_select_member on public.call_transcripts;
create policy call_transcripts_select_member on public.call_transcripts
  for select
  using (
    exists (
      select 1 from public.rooms r
      where r.id = call_transcripts.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = call_transcripts.room_id and rp.user_id = auth.uid()
    )
  );

drop policy if exists call_transcripts_insert_speaker on public.call_transcripts;
create policy call_transcripts_insert_speaker on public.call_transcripts
  for insert
  with check (
    speaker_id = auth.uid()
    and (
      exists (
        select 1 from public.rooms r
        where r.id = call_transcripts.room_id and r.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.room_participants rp
        where rp.room_id = call_transcripts.room_id and rp.user_id = auth.uid()
      )
    )
  );

-- 30-day retention: purge old transcript lines nightly.
create extension if not exists pg_cron;

select cron.schedule(
  'purge-old-call-transcripts',
  '0 3 * * *',
  $$ delete from public.call_transcripts where created_at < now() - interval '30 days' $$
);
