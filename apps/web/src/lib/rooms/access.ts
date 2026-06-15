import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Deterministic LiveKit room name for a LinguaBridge room. */
export function livekitRoomName(roomId: string): string {
  const prefix = process.env.WORKER_ROOM_PREFIX ?? "linguabridge";
  return `${prefix}-${roomId}`;
}

/** Stable LiveKit identity for a signed-in user. */
export function livekitIdentity(userId: string): string {
  return `user-${userId}`;
}

export type RoomAccess = {
  roomId: string;
  title: string;
  isOwner: boolean;
  identity: string;
  displayName: string;
  /** The language this participant wants captions in. */
  language: string;
};

/**
 * Returns the caller's access to a room, or null if they are not a member.
 * A member is the room owner or a row in room_participants. Relies on RLS:
 * non-members simply get no rows back.
 */
export async function getRoomAccess(
  user: User,
  roomId: string,
): Promise<RoomAccess | null> {
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, title, owner_id, target_language")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return null;
  }

  const isOwner = room.owner_id === user.id;

  const { data: participant } = await supabase
    .from("room_participants")
    .select("display_name, preferred_language")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!isOwner && !participant) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, preferred_language")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    participant?.display_name ??
    profile?.display_name ??
    user.email?.split("@")[0] ??
    "Guest";

  const language =
    participant?.preferred_language ??
    profile?.preferred_language ??
    "en-US";

  return {
    roomId: room.id,
    title: room.title,
    isOwner,
    identity: livekitIdentity(user.id),
    displayName,
    language,
  };
}
