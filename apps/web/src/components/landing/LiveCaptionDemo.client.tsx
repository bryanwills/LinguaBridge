"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DemoLine = {
  speaker: "Bryan" | "Gleny";
  sourceLanguage: "en-US" | "es-PE";
  original: string;
  translated: string;
};

const SCRIPT: DemoLine[] = [
  {
    speaker: "Gleny",
    sourceLanguage: "es-PE",
    original: "¿Cómo estuvo tu día? Te extrañé.",
    translated: "How was your day? I missed you.",
  },
  {
    speaker: "Bryan",
    sourceLanguage: "en-US",
    original: "It was long — but this makes it better.",
    translated: "Fue largo — pero esto lo mejora.",
  },
  {
    speaker: "Gleny",
    sourceLanguage: "es-PE",
    original: "Cuéntame todo, tenemos tiempo.",
    translated: "Tell me everything, we have time.",
  },
  {
    speaker: "Bryan",
    sourceLanguage: "en-US",
    original: "Okay — so it started with the servers...",
    translated: "Bueno — todo empezó con los servidores...",
  },
];

const TYPE_MS = 38;
const HOLD_MS = 2400;

/**
 * The product, on the landing page: a caption bar exactly like the
 * one rendered during a call. Partial captions type in; the final
 * caption settles with its translation. Respects reduced motion.
 */
export function LiveCaptionDemo() {
  const [lineIndex, setLineIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const line = SCRIPT[lineIndex % SCRIPT.length]!;
  const fullLength = line.translated.length;
  const done = chars >= fullLength;

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(
      () => {
        if (!done) {
          setChars((c) => c + 1);
        } else {
          setChars(0);
          setLineIndex((i) => (i + 1) % SCRIPT.length);
        }
      },
      done ? HOLD_MS : TYPE_MS,
    );
    return () => clearTimeout(timer);
  }, [chars, done, reducedMotion]);

  const shown = reducedMotion
    ? line.translated
    : line.translated.slice(0, chars);
  const isFinal = reducedMotion || done;

  const langClass = useMemo(
    () =>
      line.sourceLanguage === "es-PE" ? "text-lang-es" : "text-lang-en",
    [line.sourceLanguage],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/20">
      {/* Call chrome */}
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-live" />
          Translation on · room/call-with-gleny
        </span>
        <span className="font-mono">en-US ⇄ es-PE</span>
      </div>

      {/* "Video" area */}
      <div className="relative grid aspect-[16/9] grid-cols-2 gap-px bg-line">
        <ParticipantTile name="Bryan" detail="Louisville · en-US" />
        <ParticipantTile name="Gleny" detail="Lima · es-PE" />

        {/* Caption bar — the signature */}
        <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div
            className="caption-scrim mx-auto max-w-xl rounded-xl px-4 py-3 text-left"
            aria-live="polite"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className={`text-[11px] font-medium ${langClass}`}>
                {line.speaker} · {line.sourceLanguage}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">
                {isFinal ? "final" : "live"}
              </span>
            </div>
            <p className="min-h-[1.5rem] text-sm text-white sm:text-base">
              {shown}
              {!isFinal && (
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-[2px] bg-white/70" />
              )}
            </p>
            {isFinal && (
              <p className="mt-1 text-xs text-white/55">{line.original}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantTile({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="relative flex items-end bg-surface-2 p-3">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,var(--line),transparent_60%)]"
      />
      <span className="relative rounded-md bg-black/30 px-2 py-1 text-[11px] text-white/80 dark:bg-black/40">
        {name} <span className="text-white/45">· {detail}</span>
      </span>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  const queried = useRef(false);

  useEffect(() => {
    if (queried.current) return;
    queried.current = true;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
