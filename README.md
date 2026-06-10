# LinguaBridge

Live AI-translated video calls. Two people join a private room from anywhere,
speak naturally in English and Spanish, and each sees the other's words as
live captions in their own language.

**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind v4 ·
Supabase (Auth/Postgres/RLS/Storage) · LiveKit (WebRTC) · AI translation
worker · pnpm workspaces

## Monorepo layout

```text
apps/
  web/        Next.js app — auth, dashboard, rooms, call UI, captions
  worker/     LiveKit agent — audio → STT → translation → caption events
packages/
  shared/     CaptionEvent schema, domain types, language utilities
  config/     Shared tsconfig / prettier
  database/   Generated DB types (later)
supabase/
  migrations/ SQL migrations (RLS-first)
infra/
  docker/     Local LiveKit + Redis compose
docs/         Architecture, security/privacy, branch strategy, full plan
prompts/      Claude Code phase prompts
```

## Quick start

```bash
pnpm install
cp .env.example apps/web/.env.local        # fill in Supabase values
cp .env.example apps/worker/.env           # worker env
./infra/scripts/generate-secrets.sh        # generates retention cron secret etc.
docker compose -f infra/docker/docker-compose.local.yml up -d   # LiveKit + Redis
pnpm dev                                   # web on http://localhost:3000
pnpm dev:worker                            # translation worker
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Privacy posture (non-negotiable)

- Transcript saving and recording are **off by default**.
- Retention is hard-capped at **30 days**.
- Consent is displayed before translation, transcripts, or recording.
- Supabase service-role key and LiveKit API secret never reach the browser.
- RLS on every user-facing table; default deny.

See `docs/security_privacy.md` and `docs/implementation_plan.md` for the
full plan, and `docs/branch_strategy.md` for the branch/PR workflow.
