# Live AI Translation Video MVP — Implementation Plan

**Project codename:** LinguaBridge MVP  
**Primary personal use case:** Bryan and Gleny can join a private video call from the US and Peru, speak naturally in English and Spanish, and see live translated captions on the other side.  
**Target stack:** Next.js + TypeScript + Supabase/Postgres + LiveKit/WebRTC + OpenAI Realtime/translation pipeline + object storage + background workers.  
**Plan date:** 2026-06-09  
**Audience:** Claude Code / senior implementation agent

---

## 1. Product intent

Build a browser-based, mobile-friendly MVP that allows two people to communicate over video while receiving live AI translation captions. The MVP should be simple enough for Gleny to use from a WhatsApp link, but architected cleanly so it can become a real customer-facing product later.

The immediate MVP is **not** a WhatsApp plugin. WhatsApp does not expose direct hooks for live third-party video-call translation. The practical MVP is a separate secure web call room that Bryan can send to Gleny through WhatsApp.

---

## 2. Known user requirements and constraints

### 2.1 Required MVP capabilities

1. Two-person video rooms.
2. English ↔ Spanish real-time speech translation.
3. Live captions displayed during the call.
4. Each user sees the other person's translated speech in their preferred/native language.
5. Optional original transcript preservation.
6. Optional translated transcript preservation.
7. Recording support designed into the architecture, with retention capped at 30 days.
8. Google sign-in, Facebook sign-in, and email/password or magic-link sign-in.
9. Bryan can create a room and share a link with Gleny.
10. Gleny should be able to join with minimal friction.
11. The video should occupy the main screen.
12. Translations should appear either as caption overlays or in a side/popup transcript panel.
13. Content should be encrypted at rest.
14. The system should be as privacy-preserving as possible.
15. The architecture should acknowledge the tradeoff between strict E2EE, AI translation, and server-side recording.
16. Self-hosting on Bryan's public VPS should be supported.
17. The project must be Git/GitHub friendly with a deliberate branch and PR strategy.
18. First implementation milestone should be auth + dashboard.
19. Bryan does **not** want a wearable device in the MVP path.
20. Plaud Note Pro can be considered later for note capture/automation, not the initial live-call flow.

### 2.2 Product principles

- **Reduce friction:** Gleny should be able to open a link and join.
- **Protect trust:** Always show when audio is being transcribed, translated, recorded, or stored.
- **Keep original meaning:** Preserve original-language transcript when recording/transcripts are enabled.
- **Minimize retention:** Default transcript and recording retention should be short; hard cap at 30 days.
- **Avoid hidden work-device exposure:** Do not design around work laptops or company-managed devices.
- **Make it shippable:** Prioritize a narrow working vertical slice over a broad unfinished platform.

---

## 3. Architecture decision summary

### 3.1 Recommended MVP architecture

Use **Next.js App Router** for the web application, **Supabase** for Auth/Postgres/Storage/RLS, **LiveKit** for WebRTC video rooms, and an **AI translation worker/agent** that subscribes to room audio, performs speech-to-text + translation, and publishes caption events back to the room over LiveKit data channels and/or persists transcript records to Postgres.

### 3.2 Why this architecture

- Next.js + TypeScript gives a fast full-stack product surface.
- Supabase gives OAuth, email auth, Postgres, RLS, migrations, and storage without building all infrastructure from scratch.
- LiveKit avoids hand-rolling WebRTC signaling, NAT traversal, room management, and media track logic.
- A separate AI worker keeps realtime media and AI pipeline isolated from the web app.
- Postgres keeps rooms, participants, transcripts, consent, retention, and audit metadata structured.
- Object storage supports optional recordings while keeping the MVP deployable.

### 3.3 Critical E2EE decision

There are two possible modes:

#### Mode A — MVP translation mode

- Browser audio/video uses LiveKit transport.
- AI worker can access the audio stream to transcribe and translate.
- Media is encrypted in transit.
- Stored transcripts/recordings are encrypted at rest.
- This is the recommended MVP mode.

#### Mode B — Strict E2EE mode

- Browser clients encrypt media end-to-end.
- The server and LiveKit infrastructure cannot inspect raw media.
- AI translation worker cannot transcribe unless it is given the room key or translation is done locally on the clients.
- Server-side recording cannot capture usable media unless decrypted by an authorized participant/agent.
- This should be treated as a future advanced mode, not the first MVP.

**Implementation instruction:** Build the product with explicit room-level privacy modes so this decision is represented in the data model and UI. For MVP, implement `privacy_mode = 'translation_enabled'`. Leave `privacy_mode = 'strict_e2ee'` as a future enum value and UI-disabled option.

---

## 4. Initial MVP scope

### 4.1 Must build

1. Landing page.
2. Auth flow.
3. User profile onboarding.
4. Dashboard.
5. Create room.
6. Share room link.
7. Join room.
8. LiveKit token generation endpoint.
9. Two-person video UI.
10. Mute/unmute camera and mic.
11. Leave call.
12. Language preference selection.
13. Live captions panel.
14. AI translation event pipeline.
15. Transcript persistence behind explicit consent.
16. 30-day retention enforcement metadata.
17. Basic settings page.
18. Basic audit/event logging.
19. Local development Docker Compose.
20. Production deployment documentation for VPS.

### 4.2 Should build after basic call works

1. Caption overlay style toggle.
2. Side transcript panel.
3. Room invite expiration.
4. Guest join mode.
5. Recording toggle.
6. Transcript export as Markdown or JSON.
7. Call summary.
8. Action-item extraction from transcripts.
9. Notion/Gmail/Google Calendar automation hooks.
10. Twilio/Resend email invite option.

### 4.3 Explicitly out of MVP

1. Native iOS or Android app.
2. Wearable device workflow.
3. WhatsApp call interception.
4. Full social network features.
5. Multi-party enterprise meetings.
6. On-device local AI translation.
7. Payments/subscriptions.
8. SSO/SAML enterprise auth.
9. HIPAA/regulated compliance posture.
10. Production-grade global SFU clustering.

---

## 5. Repository strategy

### 5.1 Monorepo layout

Use a pnpm workspace monorepo.

```text
linguabridge/
  apps/
    web/                    # Next.js app
    worker/                 # AI translation worker / LiveKit agent
  packages/
    database/               # SQL migrations, generated DB types
    shared/                 # shared TypeScript types, zod schemas
    ui/                     # shared UI components if needed later
    config/                 # eslint, tsconfig, prettier
  supabase/
    migrations/
    seed.sql
  infra/
    docker/
    livekit/
    traefik/
    scripts/
  docs/
  prompts/
  .github/
    workflows/
```

### 5.2 Package manager

Use `pnpm`.

### 5.3 Branch strategy

Use a structured Git flow with small PRs.

```text
main
  Production-ready only. Protected.

develop
  Integration branch for accepted MVP work.

plan/implementation-plan
  Planning docs and architecture docs only.

infra/local-dev
  Docker Compose, Supabase local, LiveKit local, env templates.

feature/auth-dashboard
  First feature branch. Auth, profile, dashboard shell.

feature/room-model
  Room creation, room membership, invite links, RLS.

feature/livekit-video
  LiveKit room token endpoint and video call UI.

feature/language-preferences
  Preferred language and room participant language settings.

feature/captions-data-channel
  Realtime caption event model and UI rendering.

feature/ai-translation-worker
  Audio ingestion, STT, translation, caption publishing.

feature/transcripts-retention
  Transcript persistence, consent, deletion job, retention policy.

feature/recordings
  Optional recording metadata, object storage, retention job.

feature/automation-hooks
  Future Notion/Gmail/Calendar integration points.

release/mvp-alpha
  Stabilization branch for first deployable MVP.

hotfix/*
  Emergency patches from main.
```

### 5.4 Commit style

Use Conventional Commits.

Examples:

```text
feat(auth): add supabase oauth login
feat(room): create invite link workflow
feat(call): add livekit token route
feat(worker): publish translated caption events
fix(rls): restrict transcript reads to room members
chore(infra): add local livekit docker service
docs(plan): add mvp implementation checklist
```

---

## 6. Technology stack

### 6.1 Web app

- Next.js App Router
- TypeScript strict mode
- React
- Tailwind CSS
- shadcn/ui
- Zod
- React Hook Form
- Supabase SSR client
- LiveKit React Components
- Zustand or React Context for call-local state only

### 6.2 Backend/application layer

- Next.js Route Handlers for app-specific APIs
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Supabase Storage or S3-compatible object storage
- Optional Redis later for rate limiting/session queues

### 6.3 Realtime/video

- LiveKit server, self-hosted for VPS MVP
- LiveKit client SDK in browser
- LiveKit server SDK in Next.js token endpoint
- LiveKit agent/worker for translation pipeline

### 6.4 AI pipeline

Preferred MVP path:

1. Capture participant audio through LiveKit agent/worker.
2. Stream audio chunks to AI STT/translation provider.
3. Normalize partial and final transcript segments.
4. Translate to target language.
5. Publish caption event back to room via LiveKit data channel.
6. Persist final transcript segment if room consent allows it.

Provider abstraction:

```ts
interface TranslationProvider {
  startSession(input: TranslationSessionInput): Promise<TranslationSession>;
}

interface TranslationSession {
  sendAudioChunk(chunk: ArrayBuffer): Promise<void>;
  onPartialTranscript(cb: (event: TranscriptEvent) => void): void;
  onFinalTranscript(cb: (event: TranscriptEvent) => void): void;
  close(): Promise<void>;
}
```

Do not hardcode the AI provider throughout the application. Keep provider-specific implementation inside `apps/worker/src/providers/*`.

### 6.5 Deployment

Initial deployment target:

- Bryan's public VPS.
- Docker Compose first.
- Traefik reverse proxy can be used if already present on the VPS.
- Supabase can be cloud-hosted initially, or self-hosted later.
- LiveKit should be self-hosted for control and cost.

---

## 7. Domain model

### 7.1 Core entities

- `profiles`
- `rooms`
- `room_participants`
- `room_invites`
- `call_sessions`
- `caption_events`
- `transcript_segments`
- `recordings`
- `consent_events`
- `audit_events`
- `integration_connections`
- `automation_jobs`

### 7.2 Language model

Use BCP-47 style language codes.

```text
en-US
es-PE
es-ES
```

MVP defaults:

- Bryan: `en-US`
- Gleny: `es-PE`

Users can choose display language and spoken language independently later, but MVP can use one preferred language field.

### 7.3 Caption event format

```ts
export type CaptionEvent = {
  type: 'caption.partial' | 'caption.final' | 'caption.error';
  roomId: string;
  sessionId: string;
  speakerParticipantId: string;
  speakerDisplayName: string | null;
  sourceLanguage: string;
  targetLanguage: string;
  originalText: string;
  translatedText: string;
  startedAtMs: number | null;
  endedAtMs: number | null;
  confidence: number | null;
  provider: string;
  createdAt: string;
};
```

---

## 8. User experience flows

### 8.1 First launch

1. User opens landing page.
2. User clicks **Sign in**.
3. User chooses Google, Facebook, or email.
4. App creates profile row if needed.
5. User completes profile:
   - Display name
   - Preferred language
   - Timezone
6. User lands on dashboard.

### 8.2 Create room

1. User clicks **Create translation room**.
2. User enters room title, e.g. `Call with Gleny`.
3. User chooses:
   - My spoken language: English (US)
   - Other person's expected language: Spanish (Peru)
   - Captions: enabled
   - Save transcript: off by default
   - Record call: off by default
4. App creates room and invite link.
5. User copies invite link and sends it through WhatsApp.

### 8.3 Join room

1. Gleny opens invite link.
2. If guest mode enabled, she can enter display name and language.
3. If auth required, she signs in.
4. App shows pre-call device check.
5. App clearly indicates whether translation, transcript saving, or recording is enabled.
6. User clicks **Join call**.

### 8.4 Live translated call

1. Both participants see main video area.
2. Each participant can mute mic/camera.
3. As Bryan speaks English:
   - Bryan sees optional original English transcript.
   - Gleny sees Spanish caption.
4. As Gleny speaks Spanish:
   - Gleny sees optional original Spanish transcript.
   - Bryan sees English caption.
5. Final captions are appended to side transcript panel.
6. Partial captions can appear as low-confidence/temporary captions.

### 8.5 End call

1. User clicks **Leave**.
2. If both leave, call session is marked ended.
3. If transcript saving enabled, user can view call transcript.
4. If recording enabled, recording remains pending/processing until available.
5. Data retention job deletes eligible artifacts no later than 30 days.

---

## 9. Security and privacy plan

### 9.1 Auth

- Use Supabase Auth.
- Enable Google provider.
- Enable Facebook provider.
- Enable email provider.
- Prefer magic links for Gleny/guest simplicity.
- Use RLS for all user-owned and room-owned data.

### 9.2 Authorization

Rules:

1. A user can read their own profile.
2. A user can update their own profile.
3. A room owner can read/update their rooms.
4. Room participants can read room metadata for rooms they belong to.
5. Room participants can read transcripts only for sessions they participated in.
6. No one can read recordings unless they participated in the room and recording visibility allows it.
7. Service role is only used server-side and never exposed to the browser.

### 9.3 Invite links

- Use random opaque tokens.
- Store invite token hashes, not raw tokens.
- Support expiration.
- Support single-use invites later.
- MVP can support multi-use invite until manually revoked.

### 9.4 Data retention

Defaults:

```text
Transcript saving: off
Recording: off
Transcript retention when enabled: 30 days max
Recording retention when enabled: 30 days max
Audit metadata retention: 180 days default
```

### 9.5 Consent

Before joining, show:

- Translation is enabled.
- Audio will be processed by the translation provider.
- Transcript saving status.
- Recording status.
- Retention period.

Store a `consent_events` row when a participant joins.

### 9.6 Secrets

Never commit secrets.

Required secret locations:

- Local `.env.local` for Next.js dev.
- Worker `.env` for local worker dev.
- Production secrets stored in VPS secret manager, Docker env file outside Git, or deployment platform secrets.

---

## 10. Implementation phases

## Phase 0 — Repository bootstrap

### Goals

Create the monorepo, tooling, standards, and documentation baseline.

### Branch

`plan/implementation-plan`, then merge to `develop`.

### Tasks

1. Create pnpm workspace.
2. Create `apps/web` Next.js app with TypeScript.
3. Create `apps/worker` TypeScript Node worker.
4. Create shared package.
5. Add ESLint, Prettier, TypeScript configs.
6. Add `.env.example` files.
7. Add GitHub Actions CI.
8. Add docs.

### Acceptance criteria

- `pnpm install` succeeds.
- `pnpm lint` succeeds.
- `pnpm typecheck` succeeds.
- `pnpm test` succeeds or no-op test command clearly exists.
- Repo has documented setup instructions.

---

## Phase 1 — Auth + dashboard

### Branch

`feature/auth-dashboard`

### Goals

Implement first real feature: authentication and dashboard shell.

### Tasks

1. Configure Supabase project.
2. Enable Google auth.
3. Enable Facebook auth.
4. Enable email auth.
5. Add Supabase browser/server clients.
6. Create auth callback route.
7. Create profile table migration.
8. Create profile bootstrap logic.
9. Create dashboard route protected by auth.
10. Create settings/profile page.
11. Add language preference field.

### Acceptance criteria

- User can sign in.
- User can sign out.
- User can reach dashboard only when signed in.
- Profile row is created after first sign-in.
- User can set display name and preferred language.

---

## Phase 2 — Room model + invite links

### Branch

`feature/room-model`

### Goals

Create rooms, participants, invites, and RLS rules.

### Tasks

1. Add room tables.
2. Add room invite token logic.
3. Add room creation UI.
4. Add room detail page.
5. Add invite copy button.
6. Add join route for invite token.
7. Add participant creation.
8. Add pre-call page.
9. Add consent display.

### Acceptance criteria

- Authenticated user can create a room.
- Room owner can copy invite link.
- Invite link opens join page.
- Participant can join room membership record.
- RLS prevents unrelated users from seeing room data.

---

## Phase 3 — LiveKit video call

### Branch

`feature/livekit-video`

### Goals

Implement working two-person video call.

### Tasks

1. Add LiveKit server config.
2. Add local LiveKit Docker service.
3. Add `/api/livekit/token` route.
4. Add LiveKit React call page.
5. Add device preview.
6. Add mic/camera controls.
7. Add leave button.
8. Add call session row on join.
9. Mark participant joined/left.

### Acceptance criteria

- Two browser windows can join the same room.
- Audio/video works locally.
- Token route rejects unauthorized access.
- Room access is limited to participants/invitees.

---

## Phase 4 — Caption event UI

### Branch

`feature/captions-data-channel`

### Goals

Create frontend caption rendering before real AI pipeline is finished.

### Tasks

1. Define caption event TypeScript schema.
2. Add Zod validation.
3. Add LiveKit data channel listener.
4. Add caption overlay component.
5. Add transcript side panel.
6. Add mock caption publisher for dev.
7. Add caption event reducer/store.

### Acceptance criteria

- Mock caption events appear in overlay.
- Final captions append to transcript panel.
- Partial captions update in place.
- Invalid caption payloads are ignored/logged.

---

## Phase 5 — AI translation worker

### Branch

`feature/ai-translation-worker`

### Goals

Stream audio from LiveKit to AI translation provider and publish captions.

### Tasks

1. Connect worker to LiveKit room as agent participant.
2. Subscribe to audio tracks.
3. Segment audio per participant.
4. Implement provider abstraction.
5. Implement OpenAI provider adapter.
6. Translate English ↔ Spanish based on participant language settings.
7. Publish partial captions.
8. Publish final captions.
9. Add retry/error handling.
10. Add rate limiting guardrails.

### Acceptance criteria

- Bryan speaks English; Gleny-side client receives Spanish captions.
- Gleny speaks Spanish; Bryan-side client receives English captions.
- Worker does not crash when one participant mutes/leaves.
- Errors are visible in logs and non-fatal to video call.

---

## Phase 6 — Transcript persistence + retention

### Branch

`feature/transcripts-retention`

### Goals

Persist final transcript segments only when consent and room settings allow it.

### Tasks

1. Add transcript tables.
2. Add consent events.
3. Add room setting `transcript_enabled`.
4. Persist final transcript segments server-side.
5. Add transcript view page.
6. Add export as Markdown.
7. Add deletion script/job.
8. Add retention policy tests.

### Acceptance criteria

- Transcript saving is off by default.
- If enabled, participants must see consent screen.
- Final captions persist.
- User can view transcript after call.
- Retention job deletes expired transcript rows.

---

## Phase 7 — Optional recordings

### Branch

`feature/recordings`

### Goals

Prepare recording workflow without blocking MVP alpha.

### Tasks

1. Add recording metadata table.
2. Add room setting `recording_enabled`.
3. Add storage bucket.
4. Add recording status lifecycle.
5. Add retention deletion.
6. Add UI indicators.

### Acceptance criteria

- Recording is off by default.
- UI clearly displays when recording is enabled.
- Recording metadata is stored.
- Objects are deleted by retention job.

---

## Phase 8 — Automation hooks

### Branch

`feature/automation-hooks`

### Goals

Prepare future integrations with Notion, Gmail, Google Calendar, OpenClaw/Hermes/OpenClawd, and Plaud-style capture workflows.

### Tasks

1. Add integration connection table.
2. Add automation job table.
3. Add transcript summary job type.
4. Add action-item extraction job type.
5. Add Notion export placeholder.
6. Add Gmail draft/share placeholder.
7. Add Google Calendar reminder placeholder.

### Acceptance criteria

- No external integration is required for MVP alpha.
- Schema supports later integration safely.
- UI can show disabled/coming-soon integrations.

---

## 11. Claude Code execution instructions

Claude Code should implement in small, reviewable changes. Do not generate the entire product in one commit.

### 11.1 Global implementation rules

1. Use TypeScript strict mode.
2. Avoid `any` unless justified in comments.
3. Use Zod for boundary validation.
4. Keep server-only secrets out of client bundles.
5. Never expose Supabase service role key to browser.
6. Keep LiveKit API secret server-side only.
7. Every database table must have RLS enabled unless explicitly service-only.
8. Prefer server actions/route handlers for mutations that require authorization.
9. Use simple UI first; do not over-polish before call flow works.
10. Add logging around call/session/worker events.

### 11.2 First command sequence

```bash
pnpm create next-app apps/web \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

mkdir -p apps/worker/src packages/shared/src packages/database docs infra/docker prompts
pnpm init
```

Then manually convert root `package.json` to workspace layout.

### 11.3 Definition of done per PR

Each PR must include:

- Clear summary.
- Screenshots for UI changes.
- Migration file if database changed.
- RLS policies if table added.
- `.env.example` updates if env vars changed.
- Basic tests or documented manual verification.
- No secrets committed.

---

## 12. MVP route map

```text
/                         Landing page
/login                    Auth screen
/auth/callback            Supabase auth callback
/dashboard                Protected dashboard
/dashboard/settings       Profile and language settings
/dashboard/rooms          Room list
/dashboard/rooms/new      Create room
/rooms/[roomId]           Room detail
/join/[inviteToken]       Invite join page
/call/[roomId]            Live video call
/call/[roomId]/summary    Post-call transcript/summary
/privacy                  Privacy explanation
/terms                    Terms placeholder
```

---

## 13. API route map

```text
GET  /api/health
POST /api/rooms
GET  /api/rooms/[roomId]
POST /api/rooms/[roomId]/invites
POST /api/rooms/join
POST /api/livekit/token
POST /api/call-sessions/start
POST /api/call-sessions/end
POST /api/transcripts/export
POST /api/retention/run        # protected service-only endpoint or cron target
```

---

## 14. Environment variables

See `.env.example` in this ZIP.

Required groups:

- App URL
- Supabase
- LiveKit
- AI provider
- Storage
- Worker
- Retention
- OAuth provider settings in Supabase dashboard

---

## 15. Local development plan

### 15.1 Services

Run locally:

- Next.js web app
- Worker process
- LiveKit server
- Supabase local stack or remote Supabase dev project

### 15.2 Local workflow

1. Start Supabase local or connect to Supabase dev.
2. Start LiveKit via Docker Compose.
3. Start web app.
4. Start worker.
5. Open two browsers/profiles.
6. Sign in as two test users or use guest mode when implemented.
7. Join same room.
8. Test mock captions.
9. Test real translation worker.

---

## 16. Production deployment outline for VPS

### 16.1 DNS

Recommended names:

```text
translate.bryanwills.dev        Next.js app
livekit.bryanwills.dev          LiveKit WebRTC endpoint
```

Alternative product domain later:

```text
translate.bigbraincoding.com
api.translate.bigbraincoding.com
livekit.translate.bigbraincoding.com
```

### 16.2 Containers

```text
web
worker
livekit
redis             # optional initially, likely useful later
traefik           # if already used on VPS
```

### 16.3 TLS

Use Traefik/Let's Encrypt.

### 16.4 Firewall

Open only required ports.

LiveKit needs HTTPS/WSS plus UDP media ports. Keep firewall rules explicit in deployment docs.

---

## 17. Testing strategy

### 17.1 Unit tests

- Caption event schema validation.
- Language mapping.
- Invite token generation/hash validation.
- Authorization helper logic.
- Retention date calculations.

### 17.2 Integration tests

- User sign-in creates profile.
- Room owner can create room.
- Non-member cannot read room.
- Invite token creates participant.
- Transcript persistence respects consent.

### 17.3 Manual acceptance tests

1. Bryan account signs in.
2. Bryan creates room.
3. Bryan copies link.
4. Second browser opens link.
5. Second participant joins.
6. Video/audio works.
7. Mock captions display.
8. Real translation captions display.
9. Transcript saving off means no transcript rows.
10. Transcript saving on means final segments persist.
11. Retention script deletes expired rows.

---

## 18. Risk register

| Risk | Impact | Mitigation |
|---|---:|---|
| AI latency is too high | High | Use partial captions, low-latency provider, measure segment latency |
| E2EE conflicts with AI translation | High | Make privacy modes explicit; MVP uses translation-enabled mode |
| Recording adds complexity | Medium | Keep recording off by default and behind later phase |
| Gleny has friction joining | High | Add guest/magic-link path and WhatsApp-shareable invite |
| Mobile browser WebRTC issues | Medium | Test iPhone Safari, Chrome Android, desktop Chrome early |
| Cost runaway from AI | Medium | Add session limits, logging, room duration caps |
| Supabase RLS mistakes | High | Test RLS with separate users; deny by default |
| LiveKit network/firewall issues | Medium | Document ports and test VPS deployment early |

---

## 19. MVP success criteria

The MVP is successful when:

1. Bryan can create a private call room.
2. Gleny can join from a shared link.
3. Both can see and hear each other.
4. Bryan's English speech appears to Gleny as Spanish captions.
5. Gleny's Spanish speech appears to Bryan as English captions.
6. Captions are understandable with acceptable latency.
7. Transcript saving and recording are off by default.
8. If transcript saving is enabled, consent and retention are explicit.
9. The app can be deployed to the VPS with documented steps.
10. The codebase is clean enough to continue iterating with Claude Code.

---

## 20. Immediate next steps for Claude Code

Start with these branches in order:

```bash
git checkout -b plan/implementation-plan
# add planning docs from this ZIP
# commit and merge to develop

git checkout develop
git checkout -b infra/local-dev
# scaffold monorepo, env examples, docker compose

git checkout develop
git checkout -b feature/auth-dashboard
# implement Supabase auth + profile + dashboard
```

Do **not** start with AI translation. Build the app skeleton, auth, rooms, and working video first. Translation is valuable only after the room/call path is stable.
