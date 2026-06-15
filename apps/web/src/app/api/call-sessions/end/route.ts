import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoomAccess } from "@/lib/rooms/access";

export const runtime = "nodejs";

/**
 * Marks any active call session for a room as ended.
 * Called when a participant leaves so stale sessions do not appear as active.
 */
export async function POST(request: Request) {
  let body: { roomId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const roomId = body.roomId;
  if (!roomId) {
    return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const access = await getRoomAccess(user, roomId);
  if (!access) {
    return NextResponse.json({ error: "You do not have access to this room." }, { status: 403 });
  }

  const endedAt = new Date().toISOString();

  await supabase
    .from("call_sessions")
    .update({ status: "ended", ended_at: endedAt })
    .eq("room_id", roomId)
    .in("status", ["created", "active"]);

  await supabase
    .from("call_invitations")
    .update({ status: "cancelled", updated_at: endedAt })
    .eq("room_id", roomId)
    .eq("status", "ringing");

  return NextResponse.json({ ok: true });
}
