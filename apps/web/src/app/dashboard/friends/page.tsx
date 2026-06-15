import Link from "next/link";
import { ArrowLeft, Check, Phone, UserPlus, X } from "lucide-react";
import { languageLabel } from "@linguabridge/shared";
import { requireUser } from "@/lib/auth/user";
import { getFriendData, type FriendEntry } from "@/lib/friends/queries";
import { AddFriendForm } from "@/components/friends/AddFriendForm.client";
import {
  acceptFriendRequest,
  callFriend,
  joinActiveCall,
  removeFriendship,
} from "@/app/dashboard/friends/actions";

export const metadata = {
  title: "Friends — LinguaBridge",
};

export default async function FriendsPage() {
  const user = await requireUser();
  const { friends, incoming, outgoing, activeCalls } = await getFriendData(user);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to dashboard
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
        Friends
      </h1>
      <p className="mt-2 text-sm text-muted">
        Add registered users by email, then start a translated video call in one
        click.
      </p>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <UserPlus className="h-4 w-4 text-accent" aria-hidden="true" />
          Add a friend
        </h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          They need a LinguaBridge account. We&apos;ll send them a request to
          accept.
        </p>
        <AddFriendForm />
      </section>

      {incoming.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-muted">
            Incoming requests
          </h2>
          <ul className="grid gap-2">
            {incoming.map((entry) => (
              <li
                key={entry.friendshipId}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <Person entry={entry} />
                <div className="flex items-center gap-2">
                  <form action={acceptFriendRequest}>
                    <input
                      type="hidden"
                      name="friendshipId"
                      value={entry.friendshipId}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-contrast transition-opacity hover:opacity-90"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      Accept
                    </button>
                  </form>
                  <form action={removeFriendship}>
                    <input
                      type="hidden"
                      name="friendshipId"
                      value={entry.friendshipId}
                    />
                    <IconButton label="Decline">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        {activeCalls.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-muted">
              Active calls ({activeCalls.length})
            </h2>
            <ul className="grid gap-2">
              {activeCalls.map((call) => (
                <li
                  key={call.invitationId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {call.roomTitle}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {call.isCaller ? "Calling" : "Incoming"} with{" "}
                      {call.otherPerson.displayName}
                    </p>
                  </div>
                  <form action={joinActiveCall}>
                    <input
                      type="hidden"
                      name="invitationId"
                      value={call.invitationId}
                    />
                    <input type="hidden" name="roomId" value={call.roomId} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-contrast transition-opacity hover:opacity-90"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      Join now
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="mb-3 text-sm font-medium text-muted">
          Your friends {friends.length > 0 && `(${friends.length})`}
        </h2>
        {friends.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-6 text-sm text-muted">
            No friends yet. Add someone by email above to start a call.
          </p>
        ) : (
          <ul className="grid gap-2">
            {friends.map((entry) => (
              <li
                key={entry.friendshipId}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <Person entry={entry} />
                <div className="flex items-center gap-2">
                  <form action={callFriend}>
                    <input
                      type="hidden"
                      name="friendId"
                      value={entry.person.id}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-contrast transition-opacity hover:opacity-90"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      Call
                    </button>
                  </form>
                  <form action={removeFriendship}>
                    <input
                      type="hidden"
                      name="friendshipId"
                      value={entry.friendshipId}
                    />
                    <IconButton label="Remove friend">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-medium text-muted">Pending sent</h2>
          <ul className="grid gap-2">
            {outgoing.map((entry) => (
              <li
                key={entry.friendshipId}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3"
              >
                <Person entry={entry} />
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">Awaiting reply</span>
                  <form action={removeFriendship}>
                    <input
                      type="hidden"
                      name="friendshipId"
                      value={entry.friendshipId}
                    />
                    <IconButton label="Cancel request">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Person({ entry }: { entry: FriendEntry }) {
  const initial = entry.person.displayName.charAt(0).toUpperCase() || "?";
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface-2 text-sm font-medium text-muted">
        {initial}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{entry.person.displayName}</p>
        <p className="truncate text-xs text-muted">
          Captions in {languageLabel(entry.person.language)}
        </p>
      </div>
    </div>
  );
}

function IconButton({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-red-500/50 hover:text-red-500"
    >
      {children}
    </button>
  );
}
