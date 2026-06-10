# Repository Structure

```text
linguabridge/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        server/
        styles/
      public/
    worker/
      src/
        livekit/
        providers/
        translation/
        persistence/
        config/
  packages/
    shared/
      src/
        schemas/
        types/
        languages/
    database/
      migrations/
      types/
    config/
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
```

## Naming conventions

- React components: `PascalCase.tsx`
- Hooks: `useThing.ts`
- Server-only files: `*.server.ts`
- Client-only files: `*.client.tsx`
- Zod schemas: `thing.schema.ts`
- DB migrations: `YYYYMMDDHHMMSS_description.sql`

## Feature folder pattern

```text
features/
  rooms/
    components/
    actions/
    queries/
    schemas/
    types.ts
```
