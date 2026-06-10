# Claude Code Prompt — Phase 3 LiveKit Video

Implement `feature/livekit-video`.

## Goal

Build a working two-person LiveKit video call flow.

## Requirements

- Add LiveKit client dependencies to web app.
- Add LiveKit server SDK to token route.
- Implement `/api/livekit/token`.
- Implement `/call/[roomId]`.
- Require room access before issuing token.
- Include mic/camera controls.
- Include leave button.
- Include visible translation/caption status placeholder.

## Acceptance tests

- Two browser profiles can join same room.
- Audio/video works.
- Unauthorized users cannot get a token for a private room.
- Leaving the call disconnects cleanly.
