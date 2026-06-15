import "server-only";
import type { User } from "@supabase/supabase-js";
import type { FriendshipStatus } from "@linguabridge/shared";
import { createClient } from "@/lib/supabase/server";

export type FriendPerson = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  language: string;
};

export type FriendEntry = {
  friendshipId: string;
  person: FriendPerson;
  status: FriendshipStatus;
};

export type FriendData = {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
  activeCalls: ActiveCallEntry[];
};

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
};

export type ActiveCallEntry = {
  invitationId: string;
  roomId: string;
  roomTitle: string;
  status: "ringing" | "accepted";
  isCaller: boolean;
  otherPerson: FriendPerson;
  createdAt: string;
};

type CallInvitationRow = {
  id: string;
  room_id: string;
  caller_id: string;
  callee_id: string;
  status: "ringing" | "accepted";
  created_at: string;
};

type CallSessionRow = {
  room_id: string;
  status: "created" | "active" | "ended" | "failed";
  started_at: string | null;
  ended_at: string | null;
};

/** Loads the caller's friends plus pending requests in both directions. */
export async function getFriendData(user: User): Promise<FriendData> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, created_at")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const friendships = (rows ?? []) as FriendshipRow[];
  const { data: invitationRows } = await supabase
    .from("call_invitations")
    .select("id, room_id, caller_id, callee_id, status, created_at")
    .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
    .in("status", ["ringing", "accepted"])
    .order("created_at", { ascending: false });

  const invitations = (invitationRows ?? []) as CallInvitationRow[];

  const { data: sessionRows } = await supabase
    .from("call_sessions")
    .select("room_id, status, started_at, ended_at")
    .in("status", ["created", "active"]);
  const sessions = (sessionRows ?? []) as CallSessionRow[];

  if (friendships.length === 0 && invitations.length === 0) {
    return { friends: [], incoming: [], outgoing: [], activeCalls: [] };
  }

  const friendshipOtherIds = friendships.map((f) =>
    f.requester_id === user.id ? f.addressee_id : f.requester_id,
  );
  const invitationOtherIds = invitations.map((i) =>
    i.caller_id === user.id ? i.callee_id : i.caller_id,
  );
  const otherIds = Array.from(
    new Set([...friendshipOtherIds, ...invitationOtherIds]),
  );

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, preferred_language")
    .in("id", otherIds);

  const profiles = new Map(
    (profileRows ?? []).map((p) => [
      p.id,
      {
        id: p.id,
        displayName: p.display_name ?? "LinguaBridge user",
        avatarUrl: p.avatar_url ?? null,
        language: p.preferred_language ?? "en-US",
      } satisfies FriendPerson,
    ]),
  );

  const friends: FriendEntry[] = [];
  const incoming: FriendEntry[] = [];
  const outgoing: FriendEntry[] = [];
  const activeCalls: ActiveCallEntry[] = [];

  for (const f of friendships) {
    const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
    const person =
      profiles.get(otherId) ??
      ({
        id: otherId,
        displayName: "LinguaBridge user",
        avatarUrl: null,
        language: "en-US",
      } satisfies FriendPerson);

    const entry: FriendEntry = { friendshipId: f.id, person, status: f.status };

    if (f.status === "accepted") {
      friends.push(entry);
    } else if (f.status === "pending") {
      if (f.addressee_id === user.id) {
        incoming.push(entry);
      } else {
        outgoing.push(entry);
      }
    }
  }

  const activeRoomIds = new Set(
    sessions.filter((s) => !s.ended_at).map((s) => s.room_id),
  );
  const now = Date.now();
  const maxRingingAgeMs = 10 * 60 * 1000;
  const candidateInvitations = invitations.filter((i) => {
    if (i.status === "accepted") {
      return activeRoomIds.has(i.room_id);
    }
    // Only keep ringing invites briefly to avoid stale "active" items.
    const ageMs = now - new Date(i.created_at).getTime();
    return activeRoomIds.has(i.room_id) || ageMs <= maxRingingAgeMs;
  });

  const invitationByRoom = new Map<string, CallInvitationRow>();
  for (const i of candidateInvitations) {
    if (!invitationByRoom.has(i.room_id)) {
      invitationByRoom.set(i.room_id, i);
    }
  }
  const dedupedInvitations = Array.from(invitationByRoom.values());

  const roomIds = Array.from(new Set(dedupedInvitations.map((i) => i.room_id)));
  const { data: roomRows } = roomIds.length
    ? await supabase.from("rooms").select("id, title").in("id", roomIds)
    : { data: [] as { id: string; title: string }[] };
  const rooms = new Map((roomRows ?? []).map((r) => [r.id, r.title]));

  for (const i of dedupedInvitations) {
    const otherId = i.caller_id === user.id ? i.callee_id : i.caller_id;
    const otherPerson =
      profiles.get(otherId) ??
      ({
        id: otherId,
        displayName: "LinguaBridge user",
        avatarUrl: null,
        language: "en-US",
      } satisfies FriendPerson);
    activeCalls.push({
      invitationId: i.id,
      roomId: i.room_id,
      roomTitle: rooms.get(i.room_id) ?? "Active call",
      status: i.status,
      isCaller: i.caller_id === user.id,
      otherPerson,
      createdAt: i.created_at,
    });
  }

  return { friends, incoming, outgoing, activeCalls };
}
