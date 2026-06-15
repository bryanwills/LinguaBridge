import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, getOrCreateProfile } from "@/lib/auth/user";
import { getRoomTranscript } from "@/lib/calls/transcripts";
import { TranscriptViewer } from "@/components/call/TranscriptViewer.client";

export const metadata = {
  title: "Transcript — LinguaBridge",
};

export default async function CallTranscriptPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);

  const transcript = await getRoomTranscript(roomId);
  if (!transcript) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/dashboard/calls"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Call history
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {transcript.title}
        </h1>
      </div>

      {transcript.lines.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center text-sm text-muted">
          No captions were captured for this call.
        </div>
      ) : (
        <TranscriptViewer
          lines={transcript.lines}
          viewerLanguage={profile.preferred_language}
        />
      )}
    </div>
  );
}
