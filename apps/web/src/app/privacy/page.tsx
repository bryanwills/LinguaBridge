import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Privacy
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        LinguaBridge is private by default. Transcript saving and recording
        are off unless the room owner turns them on, retention is capped at
        30 days, and every participant sees what is translated, saved, or
        recorded before joining. When translation is enabled, audio is
        processed by an AI provider to produce captions.
      </p>
      <p className="mt-4 leading-relaxed text-muted">
        The full policy ships with the MVP alpha. The engineering rules it
        will reflect live in{" "}
        <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
          docs/security_privacy.md
        </code>
        .
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-accent">
        ← Back to home
      </Link>
    </main>
  );
}
