# Claude Code Prompt — Phase 1 Auth + Dashboard

Implement `feature/auth-dashboard`.

## Goal

Build Supabase authentication, profile bootstrap, dashboard shell, and language settings.

## Requirements

- Google OAuth support through Supabase.
- Facebook OAuth support through Supabase.
- Email auth support through Supabase.
- Protected `/dashboard` route.
- Profile table integration.
- Display name and preferred language form.
- Preferred languages must include at least `en-US` and `es-PE`.

## Routes

- `/login`
- `/auth/callback`
- `/dashboard`
- `/dashboard/settings`

## Security

- Use server-side Supabase session checks where needed.
- Never use service role key in client code.
- Respect RLS.

## Acceptance tests

- Sign in works.
- Sign out works.
- Dashboard redirects unauthenticated users.
- Profile is created after first sign-in.
- User can save preferred language.
