# Architecture Specification

## System overview

```text
Browser Client A                 Browser Client B
     |                                  |
     | HTTPS / WSS                      | HTTPS / WSS
     v                                  v
Next.js Web App  <-------------->  Supabase Auth/Postgres
     |
     | LiveKit token API
     v
LiveKit Server / SFU
     |
     | Agent participant subscribes to audio tracks
     v
AI Translation Worker
     |
     | STT + translation provider
     v
Caption events back to LiveKit data channel
     |
     v
Browser clients render translated captions
```

## Runtime components

### Web app

The web app owns:

- Auth UI.
- Dashboard.
- Room creation.
- Invite flow.
- Pre-call consent screen.
- Live call UI.
- Caption overlay and transcript panel.
- Transcript/summary view.

### Supabase

Supabase owns:

- Authentication.
- Postgres application database.
- Row Level Security.
- Optional object storage.

### LiveKit

LiveKit owns:

- WebRTC signaling.
- Audio/video media routing.
- Data channel messaging.
- Room participant lifecycle.

### Worker

The worker owns:

- Joining LiveKit rooms as an agent participant.
- Receiving participant audio.
- Sending audio to AI provider.
- Receiving partial/final transcript results.
- Translating into target language.
- Publishing caption events.
- Persisting final transcript segments when enabled.

## Privacy modes

### translation_enabled

Used by MVP. AI worker receives audio for translation. This mode can support AI captions, transcript saving, and recording.

### strict_e2ee

Future mode. Media is client-encrypted in a way the server cannot inspect. AI translation requires either client-side AI or securely provisioned room keys to a trusted agent. Recording becomes complex and should be disabled unless explicitly designed.

## Caption delivery

Use LiveKit data channel for low-latency caption events.

- Partial captions should be ephemeral.
- Final captions can be persisted if consent allows.
- Data channel payloads must be validated on the client.

## Persistence boundary

Persist only final transcript segments. Do not persist partial fragments unless specifically needed for debugging, and never in production without explicit debug mode.

## Failure behavior

Video must keep working if AI translation fails.

Expected failures:

- AI provider timeout.
- Worker disconnect.
- Participant mutes.
- Participant changes device.
- Language confidence is low.
- LiveKit room ends.

Client behavior:

- Show non-blocking caption status.
- Do not end video call just because captions fail.

Worker behavior:

- Log structured errors.
- Reconnect if safe.
- Stop processing when room is empty.
- Avoid retry storms.
