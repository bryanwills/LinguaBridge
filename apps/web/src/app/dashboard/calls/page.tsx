import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth/user";
import { listRecentCalls } from "@/lib/calls/transcripts";

export const metadata = {
  title: "Call history — LinguaBridge",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function CallsPage() {
  await requireUser();
  const calls = await listRecentCalls();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Call history
        </h1>
        <p className="mt-1 text-sm text-muted">
          Transcripts and translations are saved for 30 days.
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center text-sm text-muted">
          No saved transcripts yet. Captions from your calls will show up here.
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {calls.map((call) => (
            <li key={call.roomId}>
              <Link
                href={`/dashboard/calls/${call.roomId}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <FileText className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {call.title}
                  </span>
                  <span className="block text-xs text-muted">
                    {formatWhen(call.lastAt)} · {call.lineCount} line
                    {call.lineCount === 1 ? "" : "s"}
                  </span>
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
