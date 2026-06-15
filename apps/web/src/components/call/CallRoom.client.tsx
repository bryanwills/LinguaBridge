"use client";

import "@livekit/components-styles";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Track } from "livekit-client";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useRoomContext,
  useTracks,
} from "@livekit/components-react";
import { ArrowLeft, Check, Copy, Loader2, Volume2 } from "lucide-react";
import { LiveCaptions } from "@/components/call/LiveCaptions.client";

type TokenResponse = {
  token: string;
  serverUrl: string;
  displayName: string;
  language: string;
};

export function CallRoom({
  roomId,
  title,
  language,
  userId,
  displayName,
}: {
  roomId: string;
  title: string;
  language: string;
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [conn, setConn] = useState<TokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  // Only end the session if we actually connected. Prevents React StrictMode's
  // mount→cleanup→mount probe from firing the "end session" beacon, which would
  // otherwise cancel the callee's ringing invitation moments after the call starts.
  const connectedRef = useRef(false);

  const endSession = useCallback(async () => {
    try {
      await fetch("/api/call-sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
        keepalive: true,
      });
    } catch {
      // Best-effort cleanup.
    }
  }, [roomId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Could not join the call.");
        }
        const data = (await res.json()) as TokenResponse;
        if (!cancelled) setConn(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not join.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  // End the session if the tab/window closes mid-call — but only once we have
  // genuinely connected, so a StrictMode remount can't cancel the live ring.
  useEffect(() => {
    return () => {
      if (!connectedRef.current) return;
      const payload = JSON.stringify({ roomId });
      if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
        navigator.sendBeacon(
          "/api/call-sessions/end",
          new Blob([payload], { type: "application/json" }),
        );
      }
    };
  }, [roomId]);

  const leave = useCallback(async () => {
    if (!ending) {
      setEnding(true);
      await endSession();
    }
    router.push("/dashboard");
  }, [endSession, ending, router]);

  if (error) {
    return (
      <CallShell title={title}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-sm text-sm text-muted">{error}</p>
          <button
            onClick={() => void leave()}
            className="rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Back to dashboard
          </button>
        </div>
      </CallShell>
    );
  }

  if (!conn || !conn.serverUrl) {
    return (
      <CallShell title={title}>
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Connecting to the call…
        </div>
      </CallShell>
    );
  }

  return (
    <LiveKitRoom
      token={conn.token}
      serverUrl={conn.serverUrl}
      connect
      audio
      video
      onConnected={() => {
        connectedRef.current = true;
      }}
      onDisconnected={() => {
        if (!connectedRef.current) return;
        void leave();
      }}
      data-lk-theme="default"
      className="flex h-dvh flex-col overflow-hidden bg-background"
    >
      <CallHeader title={title} captionLanguage={language} />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <ConferenceStage />
        <LiveCaptions
          roomId={roomId}
          userId={userId}
          displayName={displayName}
          captionLanguage={language}
        />
      </div>
      <RoomAudioRenderer />
      <StartAudioBar />
      <div className="shrink-0 border-t border-line bg-surface">
        <ControlBar
          controls={{ chat: false, screenShare: true, leave: true }}
          variation="minimal"
        />
      </div>
    </LiveKitRoom>
  );
}

function ConferenceStage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: false },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  if (tracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted">
        Waiting for the other person to join and enable their camera…
      </div>
    );
  }

  return (
    <GridLayout tracks={tracks} className="h-full">
      <ParticipantTile />
    </GridLayout>
  );
}

/** Resumes audio playback (browsers block autoplay until a gesture). */
function StartAudioBar() {
  const room = useRoomContext();
  const [needsAudio, setNeedsAudio] = useState(false);

  useEffect(() => {
    const sync = () => setNeedsAudio(!room.canPlaybackAudio);
    // Try immediately; some browsers allow it after the join gesture. The
    // sync runs in a promise callback / event handler, never synchronously.
    void room.startAudio().then(sync).catch(sync);
    room.on("audioPlaybackChanged", sync);
    return () => {
      room.off("audioPlaybackChanged", sync);
    };
  }, [room]);

  if (!needsAudio) return null;

  return (
    <button
      type="button"
      onClick={() => void room.startAudio()}
      className="flex w-full items-center justify-center gap-2 bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast"
    >
      <Volume2 className="h-4 w-4" aria-hidden="true" />
      Tap to enable call audio
    </button>
  );
}

function CallShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <CallHeaderStatic title={title} />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function CallHeaderStatic({ title }: { title: string }) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5">
      <Link2Back />
      <span className="truncate text-sm font-medium">{title}</span>
      <span className="w-[110px]" />
    </header>
  );
}

function CallHeader({
  title,
  captionLanguage,
}: {
  title: string;
  captionLanguage: string;
}) {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-2.5">
      <Link2Back />
      <div className="flex min-w-0 flex-col items-center">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="flex items-center gap-1 text-[11px] text-muted">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
          Live · {captionLanguage}
        </span>
      </div>
      <CopyInviteButton />
    </header>
  );
}

function Link2Back() {
  return (
    <a
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Dashboard
    </a>
  );
}

function CopyInviteButton() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <button
      onClick={copy}
      className="inline-flex w-[110px] items-center justify-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Invite link
        </>
      )}
    </button>
  );
}
