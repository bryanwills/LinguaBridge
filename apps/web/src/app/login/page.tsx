import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle.client";

/**
 * Placeholder until feature/auth-dashboard lands (Phase 1):
 * Google, Facebook, and email/magic-link sign-in via Supabase Auth.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Lingua<span className="text-accent">Bridge</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-5">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Authentication arrives in the{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
              feature/auth-dashboard
            </code>{" "}
            branch: Google, Facebook, and email magic links via Supabase.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full border border-line px-5 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
