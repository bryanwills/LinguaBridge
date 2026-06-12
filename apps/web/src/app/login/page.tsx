import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle.client";
import { LoginForm } from "@/components/auth/LoginForm.client";

export const metadata = {
  title: "Sign in — LinguaBridge",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

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
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <h1 className="text-center font-display text-3xl font-semibold tracking-tight">
            Welcome
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Sign in to create rooms and start translated calls.
          </p>
          <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <LoginForm nextPath={next} />
          </div>
          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            By continuing you agree to the{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
