-- LinguaBridge — friends (request/accept) and live call signaling.
-- Adds: friendships, call_invitations, a safe email lookup RPC, and the
-- RLS needed so friends can read each other's display profile.

-- ---------------------------------------------------------------------------
-- Friendships
-- ---------------------------------------------------------------------------
create type public.friendship_status as enum (
  'pending',
  'accepted',
  'declined',
  'blocked'
);

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status public.friendship_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_distinct_parties check (requester_id <> addressee_id),
  constraint friendships_unique_pair unique (requester_id, addressee_id)
);

create index idx_friendships_requester on public.friendships(requester_id);
create index idx_friendships_addressee on public.friendships(addressee_id);

alter table public.friendships enable row level security;

-- Either party can see the relationship row.
create policy "friendships_select_party" on public.friendships
  for select using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

-- You can only create a request as yourself (the requester).
create policy "friendships_insert_requester" on public.friendships
  for insert with check (requester_id = auth.uid());

-- Addressee can accept/decline; requester can cancel — both via update.
create policy "friendships_update_party" on public.friendships
  for update using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  ) with check (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

-- Either party can remove the relationship row.
create policy "friendships_delete_party" on public.friendships
  for delete using (
    requester_id = auth.uid() or addressee_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Let friends read each other's public profile fields (name, avatar, language).
-- This is OR-combined with the existing profiles_select_own policy.
-- ---------------------------------------------------------------------------
create policy "profiles_select_friends" on public.profiles
  for select using (
    exists (
      select 1 from public.friendships f
      where (f.requester_id = auth.uid() and f.addressee_id = profiles.id)
         or (f.addressee_id = auth.uid() and f.requester_id = profiles.id)
    )
  );

-- ---------------------------------------------------------------------------
-- Email lookup: profiles do not store email (it lives in auth.users).
-- A SECURITY DEFINER function lets a signed-in user resolve another registered
-- user by exact email so they can send a friend request — without exposing the
-- whole user table. Returns at most one row, never the caller themselves.
-- ---------------------------------------------------------------------------
create or replace function public.find_user_by_email(p_email text)
returns table (id uuid, display_name text, avatar_url text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.display_name, p.avatar_url
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email))
    and u.id <> auth.uid()
  limit 1;
$$;

revoke all on function public.find_user_by_email(text) from public;
grant execute on function public.find_user_by_email(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Call invitations — the "ringing" signal for a live incoming call.
-- A row is created when a user calls a friend; the callee subscribes to
-- inserts via Supabase Realtime and sees an incoming-call banner.
-- ---------------------------------------------------------------------------
create type public.call_invitation_status as enum (
  'ringing',
  'accepted',
  'declined',
  'cancelled',
  'missed'
);

create table public.call_invitations (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  status public.call_invitation_status not null default 'ringing',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_call_invitations_callee_status
  on public.call_invitations(callee_id, status);
create index idx_call_invitations_room on public.call_invitations(room_id);

alter table public.call_invitations enable row level security;

create policy "call_invitations_select_party" on public.call_invitations
  for select using (
    caller_id = auth.uid() or callee_id = auth.uid()
  );

create policy "call_invitations_insert_caller" on public.call_invitations
  for insert with check (caller_id = auth.uid());

create policy "call_invitations_update_party" on public.call_invitations
  for update using (
    caller_id = auth.uid() or callee_id = auth.uid()
  ) with check (
    caller_id = auth.uid() or callee_id = auth.uid()
  );

-- Deliver call_invitations changes over Supabase Realtime.
alter publication supabase_realtime add table public.call_invitations;
