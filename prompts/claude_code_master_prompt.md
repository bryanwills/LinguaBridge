# Claude Code Master Prompt

You are implementing the LinguaBridge MVP from the included planning files.

Read these files first:

1. `implementation_plan.md`
2. `docs/architecture.md`
3. `docs/security_privacy.md`
4. `docs/branch_strategy.md`
5. `docs/repo_structure.md`
6. `sql/001_initial_schema.sql`
7. `.env.example`

## Hard requirements

- Use Next.js App Router and TypeScript.
- Use pnpm workspaces.
- Use Supabase Auth/Postgres/RLS.
- Use LiveKit for WebRTC rooms.
- Use a separate worker for AI translation.
- Do not expose server secrets to the browser.
- Transcript and recording persistence must be off by default.
- Retention for transcripts and recordings must never exceed 30 days.
- Build in phases and use the branch strategy in `docs/branch_strategy.md`.

## First implementation branch

Start with:

```bash
git checkout -b infra/local-dev
```

Implement the monorepo scaffold, local Docker Compose, environment templates, base lint/typecheck scripts, and documentation wiring.

Do not implement the AI worker first. The first product feature branch after local dev is `feature/auth-dashboard`.

## Output expectations

For every change:

1. Explain what files changed.
2. Explain how to run it.
3. Explain how to test it.
4. Call out any env vars needed.
5. Do not commit secrets.
