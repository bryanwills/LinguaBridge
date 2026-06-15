import Link from "next/link";
import { Users, Settings, Languages } from "lucide-react";
import { languageLabel } from "@linguabridge/shared";
import { requireUser, getOrCreateProfile } from "@/lib/auth/user";

export const metadata = {
  title: "Dashboard — LinguaBridge",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);

  const firstName = profile.display_name?.split(" ")[0] ?? "there";

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Hola, {firstName}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as {user.email ?? user.phone ?? user.id}. Your captions
        language is{" "}
        <span className="font-medium text-foreground">
          {languageLabel(profile.preferred_language)}
        </span>
        .
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/friends"
          className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent"
        >
          <Users
            className="h-5 w-5 text-muted transition-colors group-hover:text-accent"
            aria-hidden="true"
          />
          <h2 className="mt-3 font-display text-lg font-semibold">
            Friends &amp; calls
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Add a registered friend by email, then start a translated video call
            in one click.
          </p>
        </Link>

        <Link
          href="/dashboard/settings"
          className="group rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-accent"
        >
          <Settings
            className="h-5 w-5 text-muted transition-colors group-hover:text-accent"
            aria-hidden="true"
          />
          <h2 className="mt-3 font-display text-lg font-semibold">Settings</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Set your display name and the language you want captions in.
          </p>
        </Link>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <Languages className="h-5 w-5 text-muted" aria-hidden="true" />
          <h2 className="mt-3 font-display text-lg font-semibold">
            Live translation
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            English ↔ Spanish captions in real time during calls, so each
            person reads in their own language.
          </p>
        </div>
      </div>
    </div>
  );
}
