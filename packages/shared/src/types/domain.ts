/**
 * Room privacy modes. The MVP implements translation_enabled only;
 * strict_e2ee is represented in the data model and UI as a disabled
 * future option (see docs/architecture.md).
 */
export type PrivacyMode = "translation_enabled" | "strict_e2ee";

export type RoomRole = "owner" | "participant" | "guest";

export type CallSessionStatus = "created" | "active" | "ended" | "failed";

export type RecordingStatus =
  | "disabled"
  | "requested"
  | "recording"
  | "processing"
  | "available"
  | "deleted"
  | "failed";

export interface RoomSettings {
  privacyMode: PrivacyMode;
  captionsEnabled: boolean;
  /** Off by default. Requires consent screen when enabled. */
  transcriptEnabled: boolean;
  /** Off by default. Requires persistent in-call indicator when enabled. */
  recordingEnabled: boolean;
  /** Hard cap: 30 days. */
  retentionDays: number;
}

export const MAX_RETENTION_DAYS = 30;
export const DEFAULT_RETENTION_DAYS = 30;
