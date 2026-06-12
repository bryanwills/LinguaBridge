# Deploying LinguaBridge to the VPS

Target: `https://talk.bryanwills.dev` behind Nginx Proxy Manager (NPM), built
on the VPS with Docker Compose.

## One-time setup

### 1. DNS

Add an `A` record for `talk.bryanwills.dev` pointing at the VPS IP.

### 2. Shared docker network for NPM

NPM proxies to the app over a shared docker network (no host ports needed):

```bash
docker network create proxy          # skip if it already exists
docker network connect proxy <npm-container-name>
```

### 3. Clone and configure

```bash
git clone https://github.com/bryanwills/LinguaBridge.git
cd LinguaBridge
cp infra/docker/env.web.example infra/docker/.env.web
nano infra/docker/.env.web        # fill in real values
```

### 4. Build and start

```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d --build
```

### 5. NPM proxy host

In Nginx Proxy Manager, add a Proxy Host:

- Domain: `talk.bryanwills.dev`
- Scheme: `http`, Forward Hostname: `linguabridge-web`, Forward Port: `3000`
- Enable **Websockets Support** (required for LiveKit later)
- Enable **Block Common Exploits**
- SSL tab: request a Let's Encrypt certificate, enable **Force SSL** and
  **HTTP/2**

### 6. Supabase URL configuration

In the Supabase dashboard → Authentication → URL Configuration:

- Site URL: `https://talk.bryanwills.dev`
- Redirect URLs: keep `http://localhost:3000/**`, add
  `https://talk.bryanwills.dev/**`

### 7. Google OAuth

In Google Cloud Console → Credentials → the LinguaBridge web client:

- Add `https://talk.bryanwills.dev` to Authorized JavaScript origins
  (the redirect URI is the Supabase callback and does not change)

## Updating after new code merges

```bash
cd LinguaBridge
git pull
docker compose -f infra/docker/docker-compose.prod.yml up -d --build
```

## Notes

- `NEXT_PUBLIC_*` values are baked into the client bundle at **build** time;
  changing them requires a rebuild, not just a restart.
- Secrets live only in `infra/docker/.env.web` on the VPS (gitignored).
- Health check: `https://talk.bryanwills.dev/api/health`
