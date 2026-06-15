"use client";

import { useCallback, useState } from "react";
import { Loader2, Languages } from "lucide-react";
import { languageLabel } from "@linguabridge/shared";
import type { TranscriptLine } from "@/lib/calls/transcripts";

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Renders a saved transcript. Lines are shown in their original language and
 * can be translated on demand into the viewer's preferred language.
 */
export function TranscriptViewer({
  lines,
  viewerLanguage,
}: {
  lines: TranscriptLine[];
  viewerLanguage: string;
}) {
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [showTranslated, setShowTranslated] = useState(false);
  const [loading, setLoading] = useState(false);

  const translateAll = useCallback(async () => {
    setLoading(true);
    const pending = lines.filter(
      (l) =>
        l.sourceLanguage.split("-")[0] !== viewerLanguage.split("-")[0] &&
        !translated[l.id],
    );

    const results = await Promise.all(
      pending.map(async (line) => {
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: line.originalText,
              sourceLanguage: line.sourceLanguage,
              targetLanguage: viewerLanguage,
            }),
          });
          const data = (await res.json()) as { translated?: string };
          return [line.id, data.translated || line.originalText] as const;
        } catch {
          return [line.id, line.originalText] as const;
        }
      }),
    );

    setTranslated((prev) => {
      const next = { ...prev };
      for (const [id, text] of results) next[id] = text;
      return next;
    });
    setShowTranslated(true);
    setLoading(false);
  }, [lines, translated, viewerLanguage]);

  const toggle = () => {
    if (showTranslated) {
      setShowTranslated(false);
    } else {
      void translateAll();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {lines.length} line{lines.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={toggle}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {showTranslated
            ? "Show original"
            : `Translate to ${languageLabel(viewerLanguage)}`}
        </button>
      </div>

      <ol className="space-y-3">
        {lines.map((line) => {
          const text =
            showTranslated && translated[line.id]
              ? translated[line.id]
              : line.originalText;
          return (
            <li
              key={line.id}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold">{line.speakerName}</span>
                <span className="text-[10px] text-muted">
                  {timeLabel(line.createdAt)} · {line.sourceLanguage}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-foreground">{text}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
