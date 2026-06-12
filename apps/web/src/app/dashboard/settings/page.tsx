import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser, getOrCreateProfile } from "@/lib/auth/user";
import { SettingsForm } from "@/components/auth/SettingsForm.client";

export const metadata = {
  title: "Settings — LinguaBridge",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
        Settings
      </h1>
      <p className="mt-2 text-sm text-muted">
        Your display name is what the other person sees. Captions are shown to
        you in your preferred language.
      </p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <SettingsForm
          initialDisplayName={profile.display_name ?? ""}
          initialLanguage={profile.preferred_language}
        />
      </div>
    </div>
  );
}
