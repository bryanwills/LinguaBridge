import "server-only";
import { createClient } from "@/lib/supabase/server";

export type CallSummary = {
  roomId: string;
  title: string;
  lastAt: string;
  lineCount: number;
};

export type TranscriptLine = {
  id: string;
  speakerName: string;
  originalText: string;
  sourceLanguage: string;
  createdAt: string;
};

/**
 * Recent calls that have a saved transcript the current user can read.
 * RLS limits call_transcripts to rooms the user belongs to, so this is safe.
 */
export async function listRecentCalls(): Promise<CallSummary[]> {
  const supabase = await createClient();

  const { data: lines } = await supabase
    .from("call_transcripts")
    .select("room_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!lines || lines.length === 0) return [];

  const byRoom = new Map<string, { lastAt: string; count: number }>();
  for (const line of lines as { room_id: string; created_at: string }[]) {
    const existing = byRoom.get(line.room_id);
    if (existing) {
      existing.count += 1;
    } else {
      byRoom.set(line.room_id, { lastAt: line.created_at, count: 1 });
    }
  }

  const roomIds = [...byRoom.keys()];
  const { data: rooms } = await supabase
    .from("rooms")
    .select("id, title")
    .in("id", roomIds);

  const titles = new Map(
    (rooms ?? []).map((r) => [r.id as string, r.title as string]),
  );

  return roomIds
    .map((roomId) => ({
      roomId,
      title: titles.get(roomId) ?? "Call",
      lastAt: byRoom.get(roomId)!.lastAt,
      lineCount: byRoom.get(roomId)!.count,
    }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

/** Full transcript for a room (chronological), or null if not accessible. */
export async function getRoomTranscript(
  roomId: string,
): Promise<{ title: string; lines: TranscriptLine[] } | null> {
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, title")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) return null;

  const { data: lines } = await supabase
    .from("call_transcripts")
    .select("id, speaker_name, original_text, source_language, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });

  return {
    title: room.title as string,
    lines: (lines ?? []).map((l) => ({
      id: l.id as string,
      speakerName: (l.speaker_name as string) || "Speaker",
      originalText: l.original_text as string,
      sourceLanguage: l.source_language as string,
      createdAt: l.created_at as string,
    })),
  };
}
