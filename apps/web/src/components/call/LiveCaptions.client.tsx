"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDataChannel, useLocalParticipant } from "@livekit/components-react";
import { Languages, MessageSquareText, MicOff } from "lucide-react";
import { languageLabel } from "@linguabridge/shared";
import { createClient } from "@/lib/supabase/client";
import {
  TranscriptDrawer,
  type TranscriptEntry,
} from "@/components/call/TranscriptDrawer.client";

const CAPTION_TOPIC = "captions";

type CaptionPayload = {
  text: string;
  lang: string;
  name: string;
};

// Minimal Web Speech API typings (not in lib.dom for all targets).
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

let captionSeq = 0;
function nextId(prefix: string) {
  captionSeq += 1;
  return `${prefix}-${Date.now()}-${captionSeq}`;
}

/**
 * Live captions + translation + persisted transcript:
 * - Transcribes the local speaker (Web Speech API) in their language.
 * - Publishes final phrases over the LiveKit data channel.
 * - Translates inbound phrases into this user's caption language.
 * - Keeps the full transcript in a toggleable, auto-scrolling drawer.
 * - Persists each spoken line to call_transcripts (retained 30 days).
 */
export function LiveCaptions({
  roomId,
  userId,
  displayName,
  captionLanguage,
}: {
  roomId: string;
  userId: string;
  displayName: string;
  captionLanguage: string;
}) {
  const { localParticipant } = useLocalParticipant();
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [interim, setInterim] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Lazy init avoids a synchronous setState in an effect; this component only
  // renders on the client (after the room connects), so window is available.
  const [sttSupported, setSttSupported] = useState(
    () => getSpeechRecognition() !== null,
  );
  const [listening, setListening] = useState(false);

  const label = languageLabel(captionLanguage);

  const selfNameRef = useRef(displayName);
  useEffect(() => {
    selfNameRef.current =
      localParticipant?.name || localParticipant?.identity || displayName;
  }, [localParticipant, displayName]);

  const persistLine = useCallback(
    async (text: string, lang: string) => {
      try {
        const supabase = createClient();
        await supabase.from("call_transcripts").insert({
          room_id: roomId,
          speaker_id: userId,
          speaker_name: displayName,
          original_text: text,
          source_language: lang,
        });
      } catch {
        // Persistence is best-effort; the live call must never block on it.
      }
    },
    [roomId, userId, displayName],
  );

  const renderIncoming = useCallback(
    async (payload: CaptionPayload) => {
      const id = nextId("in");
      const sameLang =
        payload.lang.split("-")[0] === captionLanguage.split("-")[0];

      setEntries((prev) => [
        ...prev,
        {
          id,
          speaker: payload.name || "Friend",
          fromSelf: false,
          original: payload.text,
          translated: sameLang ? payload.text : "…",
          at: Date.now(),
        },
      ]);

      if (sameLang) return;

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: payload.text,
            sourceLanguage: payload.lang,
            targetLanguage: captionLanguage,
          }),
        });
        const data = (await res.json()) as { translated?: string };
        const translated = data.translated || payload.text;
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, translated } : e)),
        );
      } catch {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, translated: payload.text } : e,
          ),
        );
      }
    },
    [captionLanguage],
  );

  const { send } = useDataChannel(CAPTION_TOPIC, (msg) => {
    let payload: CaptionPayload;
    try {
      payload = JSON.parse(decoder.decode(msg.payload)) as CaptionPayload;
    } catch {
      return;
    }
    if (!payload.text) return;
    void renderIncoming(payload);
  });

  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  // Speech recognition for the local speaker.
  useEffect(() => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = captionLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    let stopped = false;
    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (!result.isFinal) {
          interimText += `${text} `;
          continue;
        }
        if (!text) continue;

        const name = selfNameRef.current;
        const payload: CaptionPayload = { text, lang: captionLanguage, name };
        try {
          void sendRef.current(encoder.encode(JSON.stringify(payload)), {
            reliable: true,
            topic: CAPTION_TOPIC,
          });
        } catch {
          // Data channel not ready yet; the line is still persisted/shown.
        }

        setEntries((prev) => [
          ...prev,
          {
            id: nextId("self"),
            speaker: "You",
            fromSelf: true,
            original: text,
            translated: text,
            at: Date.now(),
          },
        ]);
        void persistLine(text, captionLanguage);
      }
      setInterim(interimText.trim());
    };

    recognition.onerror = () => {
      // no-op; onend will restart
    };
    recognition.onend = () => {
      if (!stopped) {
        try {
          recognition.start();
        } catch {
          // Already starting; ignore.
        }
      } else {
        setListening(false);
      }
    };

    try {
      recognition.start();
    } catch {
      queueMicrotask(() => setSttSupported(false));
    }

    return () => {
      stopped = true;
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, [captionLanguage, persistLine]);

  const latest = entries[entries.length - 1];
  const overlayText = interim || latest?.translated;
  const overlaySpeaker = interim ? "You" : (latest?.speaker ?? "");

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-1.5 px-4 pb-3">
        {overlayText && (
          <div className="caption-scrim max-w-2xl rounded-xl px-4 py-2 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">
              {overlaySpeaker}
            </p>
            <p
              className={
                interim
                  ? "text-base font-medium text-white/70 italic"
                  : "text-base font-medium text-white"
              }
            >
              {overlayText}
            </p>
            {!interim &&
              latest &&
              !latest.fromSelf &&
              latest.original !== latest.translated && (
                <p className="mt-0.5 text-xs text-white/50">
                  {latest.original}
                </p>
              )}
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] text-white/70 backdrop-blur">
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-white transition-colors hover:bg-white/10"
            aria-pressed={drawerOpen}
          >
            <MessageSquareText className="h-3.5 w-3.5" aria-hidden="true" />
            Transcript
          </button>
          <span className="h-3 w-px bg-white/20" aria-hidden="true" />
          <span className="flex items-center gap-1">
            <Languages className="h-3 w-3 text-accent" aria-hidden="true" />
            {label}
          </span>
          {!sttSupported && (
            <span className="ml-1 flex items-center gap-1 text-amber-300">
              <MicOff className="h-3 w-3" aria-hidden="true" />
              no speech capture in this browser
            </span>
          )}
          {sttSupported && !listening && (
            <span className="ml-1 text-white/50">starting…</span>
          )}
        </div>
      </div>

      <TranscriptDrawer
        entries={entries}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        languageLabel={label}
      />
    </>
  );
}
