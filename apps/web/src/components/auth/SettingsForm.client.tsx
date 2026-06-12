"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@linguabridge/shared";
import {
  updateProfile,
  type UpdateProfileState,
} from "@/app/dashboard/settings/actions";

const initialState: UpdateProfileState = { status: "idle" };

const inputClass =
  "w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none";

export function SettingsForm({
  initialDisplayName,
  initialLanguage,
}: {
  initialDisplayName: string;
  initialLanguage: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateProfile,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Display name</span>
        <input
          type="text"
          name="displayName"
          required
          maxLength={80}
          defaultValue={initialDisplayName}
          placeholder="e.g. Bryan"
          className={inputClass}
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className="text-muted">Preferred caption language</span>
        <select
          name="preferredLanguage"
          defaultValue={initialLanguage}
          className={inputClass}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label} — {lang.nativeLabel}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        Save changes
      </button>

      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p
          role="status"
          className="rounded-lg border border-live/30 bg-live/10 px-3 py-2 text-sm text-live"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
