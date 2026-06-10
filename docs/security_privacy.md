# Security and Privacy Requirements

## Non-negotiables

1. Never expose Supabase service role key to the browser.
2. Never expose LiveKit API secret to the browser.
3. Enable RLS on user-facing tables.
4. Transcript saving is off by default.
5. Recording is off by default.
6. Consent must be displayed before translation/recording/transcript saving.
7. Retention must never exceed 30 days for transcripts and recordings.
8. Invite tokens must be random and unguessable.
9. Store invite token hashes, not raw invite tokens.
10. Log security-relevant events without logging full transcript content by default.

## RLS policy posture

Default deny. Add explicit allow policies per table.

## Data classes

### Low sensitivity

- Profile display name.
- Language preference.
- Room title.

### Medium sensitivity

- Room membership.
- Join/leave times.
- Consent event metadata.

### High sensitivity

- Original transcript text.
- Translated transcript text.
- Audio/video recordings.
- AI provider payloads.

## AI provider privacy

The UI must disclose that audio is processed by an AI provider when translation is enabled.

## Recording UI requirement

When recording is enabled, show a persistent visual indicator in the call UI.
