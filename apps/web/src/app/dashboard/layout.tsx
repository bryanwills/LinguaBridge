import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle.client";
import { signOut } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth/user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href="/dashboard"
            className="font-display text-lg font-semibold tracking-tight"
          >
            Lingua<span className="text-accent">Bridge</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-accent hover:text-accent"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        {children}
      </main>
    </div>
  );
}
