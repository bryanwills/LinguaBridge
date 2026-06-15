"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  sendFriendRequest,
  type FriendActionState,
} from "@/app/dashboard/friends/actions";

const initialState: FriendActionState = { status: "idle" };

export function AddFriendForm() {
  const [state, formAction, pending] = useActionState(
    sendFriendRequest,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3"
      suppressHydrationWarning
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder="friend@example.com"
          suppressHydrationWarning
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          Add friend
        </button>
      </div>

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
