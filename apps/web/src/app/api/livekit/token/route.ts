import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase/server";
import { getRoomAccess, livekitRoomName } from "@/lib/rooms/access";

export const runtime = "nodejs";

/**
 * Mints a LiveKit access token for a room the caller is a member of.
 * Unauthorized users (not owner, not a participant) get 403 — they can never
 * obtain a token for a private room.
 */
export async function POST(request: Request) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit is not configured." },
      { status: 500 },
    );
  }

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
    return NextResponse.json(
      { error: "You do not have access to this room." },
      { status: 403 },
    );
  }

  const roomName = livekitRoomName(roomId);
  const at = new AccessToken(apiKey, apiSecret, {
    identity: access.identity,
    name: access.displayName,
    ttl: "2h",
  });
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  const configuredServerUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";
  let serverUrl = configuredServerUrl;
  // Dev UX: if configured with localhost, swap to request host so other devices
  // on LAN (e.g. iPhone) can connect to the Mac's LiveKit instance.
  if (/^wss?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredServerUrl)) {
    const requestHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (requestHost) {
      const hostname = requestHost.split(":")[0];
      serverUrl = configuredServerUrl.replace(
        /^ws(s?):\/\/(localhost|127\.0\.0\.1)/i,
        `ws$1://${hostname}`,
      );
    }
  }

  return NextResponse.json({
    token,
    serverUrl,
    roomName,
    identity: access.identity,
    displayName: access.displayName,
    language: access.language,
  });
}
