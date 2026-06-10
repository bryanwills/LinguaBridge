import { z } from "zod";

/**
 * Caption events travel over the LiveKit data channel from the
 * translation worker to browser clients. Payloads must be validated
 * on the client before rendering — never trust the wire.
 */
export const captionEventTypeSchema = z.enum([
  "caption.partial",
  "caption.final",
  "caption.error",
]);

export const captionEventSchema = z.object({
  type: captionEventTypeSchema,
  roomId: z.string().uuid(),
  sessionId: z.string(),
  speakerParticipantId: z.string(),
  speakerDisplayName: z.string().nullable(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  originalText: z.string(),
  translatedText: z.string(),
  startedAtMs: z.number().nullable(),
  endedAtMs: z.number().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  provider: z.string(),
  createdAt: z.string(),
});

export type CaptionEventType = z.infer<typeof captionEventTypeSchema>;
export type CaptionEvent = z.infer<typeof captionEventSchema>;

/** Parse an unknown data-channel payload; returns null when invalid. */
export function parseCaptionEvent(payload: unknown): CaptionEvent | null {
  const result = captionEventSchema.safeParse(payload);
  return result.success ? result.data : null;
}
