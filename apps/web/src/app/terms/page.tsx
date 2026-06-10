import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Terms
      </h1>
      <p className="mt-4 leading-relaxed text-muted">
        Placeholder. Terms of service ship with the MVP alpha release.
      </p>
      <Link href="/" className="mt-8 inline-block text-sm text-accent">
        ← Back to home
      </Link>
    </main>
  );
}
