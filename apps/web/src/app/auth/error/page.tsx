import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Sign-in problem
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          That sign-in link is invalid or has expired. Please try again.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
