-- LinguaBridge MVP initial schema
-- Apply through Supabase migrations.

create extension if not exists pgcrypto;

create type public.privacy_mode as enum (
  'translation_enabled',
  'strict_e2ee'
);

create type public.room_role as enum (
  'owner',
  'participant',
  'guest'
);

create type public.call_session_status as enum (
  'created',
  'active',
  'ended',
  'failed'
);

create type public.recording_status as enum (
  'disabled',
  'requested',
  'recording',
  'processing',
  'available',
  'deleted',
  'failed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  preferred_language text not null default 'en-US',
  timezone text not null default 'America/New_York',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  privacy_mode public.privacy_mode not null default 'translation_enabled',
  source_language text,
  target_language text,
  captions_enabled boolean not null default true,
  transcript_enabled boolean not null default false,
  recording_enabled boolean not null default false,
  retention_days integer not null default 30 check (retention_days between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.room_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  role public.room_role not null default 'participant',
  display_name text,
  preferred_language text not null default 'en-US',
  livekit_identity text not null,
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  unique(room_id, livekit_identity)
);

create table public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  livekit_room_name text not null,
  status public.call_session_status not null default 'created',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.consent_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  call_session_id uuid references public.call_sessions(id) on delete cascade,
  participant_id uuid references public.room_participants(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  translation_enabled boolean not null,
  transcript_enabled boolean not null,
  recording_enabled boolean not null,
  retention_days integer not null check (retention_days between 1 and 30),
  consented_at timestamptz not null default now(),
  consent_version text not null default '2026-06-09-mvp'
);

create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  speaker_participant_id uuid references public.room_participants(id) on delete set null,
  source_language text not null,
  target_language text not null,
  original_text text not null,
  translated_text text not null,
  started_at_ms integer,
  ended_at_ms integer,
  confidence numeric(4,3),
  provider text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.recordings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  call_session_id uuid not null references public.call_sessions(id) on delete cascade,
  status public.recording_status not null default 'disabled',
  storage_bucket text,
  storage_path text,
  size_bytes bigint,
  duration_seconds integer,
  started_at timestamptz,
  ended_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  room_id uuid references public.rooms(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  status text not null default 'disabled',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, provider)
);

create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  call_session_id uuid references public.call_sessions(id) on delete cascade,
  job_type text not null,
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  error text,
  run_after timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_participants enable row level security;
alter table public.room_invites enable row level security;
alter table public.call_sessions enable row level security;
alter table public.consent_events enable row level security;
alter table public.transcript_segments enable row level security;
alter table public.recordings enable row level security;
alter table public.audit_events enable row level security;
alter table public.integration_connections enable row level security;
alter table public.automation_jobs enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "rooms_select_member" on public.rooms
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = rooms.id and rp.user_id = auth.uid()
    )
  );

create policy "rooms_insert_owner" on public.rooms
  for insert with check (owner_id = auth.uid());

create policy "rooms_update_owner" on public.rooms
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "room_participants_select_member" on public.room_participants
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rooms r
      where r.id = room_participants.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = room_participants.room_id and rp.user_id = auth.uid()
    )
  );

create policy "room_participants_insert_self_or_owner" on public.room_participants
  for insert with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.rooms r
      where r.id = room_participants.room_id and r.owner_id = auth.uid()
    )
  );

create policy "room_invites_select_owner" on public.room_invites
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = room_invites.room_id and r.owner_id = auth.uid()
    )
  );

create policy "room_invites_insert_owner" on public.room_invites
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.rooms r
      where r.id = room_invites.room_id and r.owner_id = auth.uid()
    )
  );

create policy "call_sessions_select_member" on public.call_sessions
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = call_sessions.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = call_sessions.room_id and rp.user_id = auth.uid()
    )
  );

create policy "consent_events_select_own_or_owner" on public.consent_events
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.rooms r
      where r.id = consent_events.room_id and r.owner_id = auth.uid()
    )
  );

create policy "transcript_segments_select_member" on public.transcript_segments
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = transcript_segments.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = transcript_segments.room_id and rp.user_id = auth.uid()
    )
  );

create policy "recordings_select_member" on public.recordings
  for select using (
    exists (
      select 1 from public.rooms r
      where r.id = recordings.room_id and r.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.room_participants rp
      where rp.room_id = recordings.room_id and rp.user_id = auth.uid()
    )
  );

create policy "integration_connections_owner" on public.integration_connections
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "automation_jobs_owner" on public.automation_jobs
  for select using (user_id = auth.uid());

create index idx_rooms_owner_id on public.rooms(owner_id);
create index idx_room_participants_room_id on public.room_participants(room_id);
create index idx_room_participants_user_id on public.room_participants(user_id);
create index idx_room_invites_room_id on public.room_invites(room_id);
create index idx_call_sessions_room_id on public.call_sessions(room_id);
create index idx_transcript_segments_room_session on public.transcript_segments(room_id, call_session_id);
create index idx_transcript_segments_expires_at on public.transcript_segments(expires_at);
create index idx_recordings_expires_at on public.recordings(expires_at);
create index idx_audit_events_room_id_created_at on public.audit_events(room_id, created_at desc);
