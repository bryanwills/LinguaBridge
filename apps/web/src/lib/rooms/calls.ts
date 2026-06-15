import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { livekitIdentity, livekitRoomName } from "@/lib/rooms/access";

type ProfileRow = {
  id: string;
  display_name: string | null;
  preferred_language: string;
};

async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, preferred_language")
    .eq("id", userId)
    .maybeSingle();
  return data as ProfileRow | null;
}

export type CreatedCall = {
  roomId: string;
  invitationId: string;
  callSessionId: string;
};

/**
 * Creates a one-to-one call room between the caller and an existing friend:
 * inserts the room, adds both as participants, and rings the callee via a
 * call_invitations row. Both the live ring and the room link point here.
 */
export async function createCallWithFriend(
  supabase: SupabaseClient,
  caller: User,
  friendId: string,
): Promise<CreatedCall> {
  const [callerProfile, calleeProfile] = await Promise.all([
    loadProfile(supabase, caller.id),
    loadProfile(supabase, friendId),
  ]);

  const callerName =
    callerProfile?.display_name ?? caller.email?.split("@")[0] ?? "Caller";
  const calleeName = calleeProfile?.display_name ?? "Friend";

  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .insert({
      owner_id: caller.id,
      title: `${callerName} & ${calleeName}`,
      source_language: callerProfile?.preferred_language ?? "en-US",
      target_language: calleeProfile?.preferred_language ?? "es-PE",
    })
    .select("id")
    .single();

  if (roomError || !room) {
    throw new Error(`Could not create room: ${roomError?.message}`);
  }

  const { error: participantsError } = await supabase
    .from("room_participants")
    .insert([
      {
        room_id: room.id,
        user_id: caller.id,
        role: "owner",
        display_name: callerName,
        preferred_language: callerProfile?.preferred_language ?? "en-US",
        livekit_identity: livekitIdentity(caller.id),
      },
      {
        room_id: room.id,
        user_id: friendId,
        role: "participant",
        display_name: calleeName,
        preferred_language: calleeProfile?.preferred_language ?? "es-PE",
        livekit_identity: livekitIdentity(friendId),
      },
    ]);

  if (participantsError) {
    throw new Error(`Could not add participants: ${participantsError.message}`);
  }

  const { data: callSession, error: callSessionError } = await supabase
    .from("call_sessions")
    .insert({
      room_id: room.id,
      livekit_room_name: livekitRoomName(room.id),
      status: "active",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (callSessionError || !callSession) {
    throw new Error(
      `Could not create call session: ${callSessionError?.message}`,
    );
  }

  const { data: invitation, error: inviteError } = await supabase
    .from("call_invitations")
    .insert({
      room_id: room.id,
      caller_id: caller.id,
      callee_id: friendId,
      status: "ringing",
    })
    .select("id")
    .single();

  if (inviteError || !invitation) {
    throw new Error(`Could not ring friend: ${inviteError?.message}`);
  }

  return { roomId: room.id, invitationId: invitation.id, callSessionId: callSession.id };
}
