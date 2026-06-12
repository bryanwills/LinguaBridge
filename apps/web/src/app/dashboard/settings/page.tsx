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
      <h1 className="font-display text-3xl font-semibold tracking-tight">
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
