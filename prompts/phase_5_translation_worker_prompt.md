# Claude Code Prompt — Phase 5 AI Translation Worker

Implement `feature/ai-translation-worker`.

## Goal

Create a worker that joins LiveKit rooms, listens to participant audio, sends audio to the AI provider, receives transcript/translation events, and publishes translated captions back to clients.

## Requirements

- Worker must be separate from Next.js app.
- Provider-specific code must live under `apps/worker/src/providers`.
- Define a provider abstraction before implementing provider-specific logic.
- Publish caption events through LiveKit data channel.
- Validate caption event payloads with shared Zod schemas.
- Persist only final transcript segments when room transcript setting and participant consent allow it.

## Acceptance tests

- Simulated audio/text provider can publish mock captions.
- Real provider can be enabled with env vars.
- Worker does not crash when one participant leaves.
- Video call continues if translation fails.
