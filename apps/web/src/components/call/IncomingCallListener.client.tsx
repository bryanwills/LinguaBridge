"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Phone, PhoneOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type IncomingCall = {
  invitationId: string;
  roomId: string;
  callerId: string;
  callerName: string;
};

const POLL_INTERVAL_MS = 3000;
const RING_MAX_AGE_MS = 60_000;

/**
 * Detects ringing call_invitations addressed to the current user and shows an
 * incoming-call banner with Join / Decline. Uses Supabase Realtime for instant
 * delivery plus a short polling fallback so a missed realtime event still rings
 * within a few seconds. Mounted in the dashboard layout.
 */
export function IncomingCallListener({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const dismissedRef = useRef<Set<string>>(new Set());

  // Don't ring while already inside a call screen.
  const onCallScreen = pathname?.startsWith("/call/") ?? false;

  const resolveCaller = useCallback(async (callerId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", callerId)
      .maybeSingle();
    return data?.display_name ?? "A friend";
  }, []);

  const considerInvitation = useCallback(
    async (row: {
      id: string;
      room_id: string;
      caller_id: string;
      status: string;
      created_at?: string;
    }) => {
      if (row.status !== "ringing") return;
      if (dismissedRef.current.has(row.id)) return;
      if (row.created_at) {
        const age = Date.now() - new Date(row.created_at).getTime();
        if (age > RING_MAX_AGE_MS) return;
      }
      const callerName = await resolveCaller(row.caller_id);
      setCall((current) =>
        current?.invitationId === row.id
          ? current
          : {
              invitationId: row.id,
              roomId: row.room_id,
              callerId: row.caller_id,
              callerName,
            },
      );
    },
    [resolveCaller],
  );

  // Polling fallback — guarantees the ring appears even if realtime misses it.
  useEffect(() => {
    // Banner is hidden while on a call screen via the render guard below;
    // skip polling there too.
    if (onCallScreen) return;
    const supabase = createClient();
    let active = true;

    const poll = async () => {
      const { data } = await supabase
        .from("call_invitations")
        .select("id, room_id, caller_id, status, created_at")
        .eq("callee_id", userId)
        .eq("status", "ringing")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!active) return;
      const row = data?.[0];
      if (row) {
        void considerInvitation(row);
      } else {
        setCall(null);
      }
    };

    void poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [userId, onCallScreen, considerInvitation]);

  // Realtime — instant delivery when available.
  useEffect(() => {
    if (onCallScreen) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`incoming-calls-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_invitations",
          filter: `callee_id=eq.${userId}`,
        },
        (payload) => {
          void considerInvitation(
            payload.new as {
              id: string;
              room_id: string;
              caller_id: string;
              status: string;
              created_at?: string;
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "call_invitations",
          filter: `callee_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string };
          setCall((current) =>
            current && current.invitationId === row.id && row.status !== "ringing"
              ? null
              : current,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, onCallScreen, considerInvitation]);

  // Ringtone while a call is pending (best-effort; autoplay may delay first tone).
  useEffect(() => {
    if (!call) return;
    let stopped = false;
    let ctx: AudioContext | null = null;
    let interval: number | null = null;

    const beep = async () => {
      try {
        ctx ??= new AudioContext();
        if (ctx.state === "suspended") await ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch {
        // Blocked until a user gesture; the visible banner still appears.
      }
    };

    void beep();
    interval = window.setInterval(() => {
      if (!stopped) void beep();
    }, 2000);

    return () => {
      stopped = true;
      if (interval) window.clearInterval(interval);
      void ctx?.close();
    };
  }, [call]);

  const respond = useCallback(
    async (status: "accepted" | "declined") => {
      if (!call) return;
      const supabase = createClient();
      dismissedRef.current.add(call.invitationId);
      await supabase
        .from("call_invitations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", call.invitationId);

      const roomId = call.roomId;
      setCall(null);
      if (status === "accepted") {
        router.push(`/call/${roomId}`);
      }
    },
    [call, router],
  );

  if (!call || onCallScreen) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-50 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-xl">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Phone className="h-5 w-5 animate-pulse" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{call.callerName}</p>
        <p className="text-xs text-muted">Incoming translated call…</p>
      </div>
      <button
        onClick={() => respond("declined")}
        aria-label="Decline call"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
      >
        <PhoneOff className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        onClick={() => respond("accepted")}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        Join
      </button>
    </div>
  );
}
