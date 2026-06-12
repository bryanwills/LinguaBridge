"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/auth/redirect";

type Mode = "sign-in" | "sign-up";
type Status =
  | { kind: "idle" }
  | { kind: "loading"; action: string }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.1 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.6 4.59 1.8l3.44-3.45C17.95 1.16 15.23 0 12 0A12 12 0 0 0 1.27 6.61l4.01 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.8-4.67 4.53-4.67 1.31 0 2.69.23 2.69.23v2.96h-1.52c-1.49 0-1.95.93-1.95 1.88V12h3.32l-.53 3.47h-2.79v8.38A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const next = sanitizeNextPath(nextPath);
  const loading = status.kind === "loading";

  function callbackUrl(path: "/auth/callback" | "/auth/confirm") {
    return `${window.location.origin}${path}?next=${encodeURIComponent(next)}`;
  }

  async function signInWithProvider(provider: "google" | "facebook") {
    setStatus({ kind: "loading", action: provider });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl("/auth/callback") },
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
    }
    // On success the browser navigates away; no state update needed.
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus({ kind: "loading", action: "password" });
    const supabase = createClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callbackUrl("/auth/confirm") },
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    if (data.session) {
      // Email confirmation disabled in Supabase: signed in immediately.
      router.push(next);
      router.refresh();
      return;
    }
    setStatus({
      kind: "success",
      message: "Check your email to confirm your account, then sign in.",
    });
  }

  async function sendMagicLink() {
    if (!email) {
      setStatus({
        kind: "error",
        message: "Enter your email above first, then request a magic link.",
      });
      return;
    }
    setStatus({ kind: "loading", action: "magic-link" });
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl("/auth/confirm") },
    });
    if (error) {
      setStatus({ kind: "error", message: error.message });
      return;
    }
    setStatus({
      kind: "success",
      message: "Magic link sent. Check your email and open it on this device.",
    });
  }

  return (
    <div>
      <div className="grid gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => signInWithProvider("google")}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => signInWithProvider("facebook")}
          className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:border-accent disabled:opacity-50"
        >
          <FacebookIcon />
          Continue with Facebook
        </button>
      </div>

      <div className="my-6 flex items-center gap-3" role="separator">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-wide text-muted">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handlePasswordSubmit} className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="text-muted">Password</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status.kind === "loading" && status.action === "password" && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        disabled={loading}
        onClick={sendMagicLink}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
        Email me a magic link instead
      </button>

      {status.kind === "error" && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {status.message}
        </p>
      )}
      {status.kind === "success" && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-sm text-live"
        >
          {status.message}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "sign-in" ? (
          <>
            New here?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("sign-up");
                setStatus({ kind: "idle" });
              }}
              className="font-medium text-accent hover:underline"
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setStatus({ kind: "idle" });
              }}
              className="font-medium text-accent hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );
}
