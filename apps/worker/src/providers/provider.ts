import type { CaptionEvent } from "@linguabridge/shared";

/**
 * Provider abstraction (implementation_plan.md §6.4).
 * Provider-specific code stays inside src/providers/* — never
 * hardcode an AI provider throughout the application.
 */
export interface TranslationSessionInput {
  roomId: string;
  sessionId: string;
  participantId: string;
  sourceLanguage: string;
  targetLanguage: string;
  sampleRateHz: number;
}

export interface TranscriptEvent {
  kind: "partial" | "final";
  originalText: string;
  translatedText: string;
  startedAtMs: number | null;
  endedAtMs: number | null;
  confidence: number | null;
}

export interface TranslationSession {
  sendAudioChunk(chunk: ArrayBuffer): Promise<void>;
  onPartialTranscript(cb: (event: TranscriptEvent) => void): void;
  onFinalTranscript(cb: (event: TranscriptEvent) => void): void;
  close(): Promise<void>;
}

export interface TranslationProvider {
  readonly name: string;
  startSession(input: TranslationSessionInput): Promise<TranslationSession>;
}

export type CaptionPublisher = (event: CaptionEvent) => Promise<void>;
