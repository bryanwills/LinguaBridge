# Branch and PR Strategy

## Protected branches

- `main`: production-ready only.
- `develop`: integration branch.

## Planning branch

- `plan/implementation-plan`: documentation, specs, prompts, and architecture only.

## Feature branches

Implement in this order:

1. `infra/local-dev`
2. `feature/auth-dashboard`
3. `feature/room-model`
4. `feature/livekit-video`
5. `feature/language-preferences`
6. `feature/captions-data-channel`
7. `feature/ai-translation-worker`
8. `feature/transcripts-retention`
9. `feature/recordings`
10. `feature/automation-hooks`

## Release branches

- `release/mvp-alpha`
- `release/mvp-beta`

## Hotfix branches

- `hotfix/<short-description>`

## PR rules

Every PR must include:

- Scope summary.
- Manual test notes.
- Screenshots for UI.
- Database migration notes.
- RLS policy notes.
- New environment variables.
- Rollback notes.

## Merge rule

Feature branches merge into `develop`. Release branches merge into `main` and back into `develop`.
