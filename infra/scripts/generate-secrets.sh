#!/usr/bin/env bash
# Generate local secrets for LinguaBridge dev with openssl rand.
# Writes apps/web/.env.local and apps/worker/.env (both gitignored).
# Safe to re-run: refuses to overwrite unless --force is passed.
set -euo pipefail

cd "$(dirname "$0")/../.."

WEB_ENV="apps/web/.env.local"
WORKER_ENV="apps/worker/.env"
FORCE="${1:-}"

if [[ -f "$WEB_ENV" && "$FORCE" != "--force" ]]; then
  echo "Refusing to overwrite existing $WEB_ENV (use --force)." >&2
  exit 1
fi

LIVEKIT_API_KEY="lk_$(openssl rand -hex 8)"
LIVEKIT_API_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
RETENTION_CRON_SECRET="$(openssl rand -hex 32)"
SUPABASE_JWT_SECRET_PLACEHOLDER="$(openssl rand -base64 48 | tr -d '\n')"

cat > "$WEB_ENV" <<ENV
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase — fill these in from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET_PLACEHOLDER}

# LiveKit (local dev server uses "devkey: secret" unless you change
# LIVEKIT_KEYS in infra/docker/docker-compose.local.yml to match these)
NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
LIVEKIT_HTTP_URL=http://localhost:7880

# Retention
DEFAULT_RETENTION_DAYS=30
MAX_RETENTION_DAYS=30
RETENTION_CRON_SECRET=${RETENTION_CRON_SECRET}
ENV

cat > "$WORKER_ENV" <<ENV
LIVEKIT_HTTP_URL=http://localhost:7880
LIVEKIT_API_KEY=${LIVEKIT_API_KEY}
LIVEKIT_API_SECRET=${LIVEKIT_API_SECRET}
AI_PROVIDER=mock
OPENAI_API_KEY=
WORKER_NAME=translation-worker-local
WORKER_LOG_LEVEL=debug
WORKER_ROOM_PREFIX=linguabridge
ENV

echo "Wrote $WEB_ENV and $WORKER_ENV with freshly generated secrets."
echo "Reminder: paste the generated LiveKit key/secret into LIVEKIT_KEYS"
echo "in infra/docker/docker-compose.local.yml, or keep dev defaults."
