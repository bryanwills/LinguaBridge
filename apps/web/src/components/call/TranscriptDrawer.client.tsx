"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, X } from "lucide-react";

export type TranscriptEntry = {
  id: string;
  speaker: string;
  fromSelf: boolean;
  original: string;
  translated: string;
  at: number;
};

function timeLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Scrollable, toggleable full-call transcript. Auto-scrolls to the newest line
 * only while the user is already at the bottom; if they scroll up to read
 * history, new lines do NOT yank the view — a "Jump to latest" pill appears.
 */
export function TranscriptDrawer({
  entries,
  open,
  onClose,
  languageLabel,
}: {
  entries: TranscriptEntry[];
  open: boolean;
  onClose: () => void;
  languageLabel: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceFromBottom < 48);
  };

  // Follow new lines only when pinned to the bottom.
  useEffect(() => {
    if (!open || !stickToBottom) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, open, stickToBottom]);

  const jumpToLatest = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setStickToBottom(true);
  };

  if (!open) return null;

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-line bg-surface/95 backdrop-blur">
      <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Transcript</p>
          <p className="text-[11px] text-muted">Captions in {languageLabel}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Hide transcript"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {entries.length === 0 ? (
          <p className="pt-6 text-center text-sm text-muted">
            Captions will appear here as people speak.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={
                    entry.fromSelf
                      ? "text-xs font-semibold text-accent"
                      : "text-xs font-semibold text-foreground"
                  }
                >
                  {entry.fromSelf ? "You" : entry.speaker}
                </span>
                <span className="text-[10px] text-muted">
                  {timeLabel(entry.at)}
                </span>
              </div>
              <p className="text-foreground">{entry.translated}</p>
              {!entry.fromSelf && entry.original !== entry.translated && (
                <p className="text-xs text-muted">{entry.original}</p>
              )}
            </div>
          ))
        )}
      </div>

      {!stickToBottom && (
        <button
          onClick={jumpToLatest}
          className="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast shadow-lg"
        >
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          Jump to latest
        </button>
      )}
    </div>
  );
}
