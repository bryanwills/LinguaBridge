import Link from "next/link";
import { ArrowRight, Link2, MessageSquareText, Video } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle.client";
import { LiveCaptionDemo } from "@/components/landing/LiveCaptionDemo.client";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Lingua<span className="text-accent">Bridge</span>
        </Link>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-full border border-line px-4 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-muted">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
              Live AI translation · MVP
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Speak your language.
              <br />
              <span className="text-lang-es">Habla tu idioma.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Private video calls with live captions translated between
              English and Spanish — so two people can just talk, and each
              reads the other in their own words.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-contrast transition-opacity hover:opacity-90"
              >
                Create a room
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                How it works
              </a>
            </div>
          </div>
          <LiveCaptionDemo />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              One link is the whole setup
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <Step
                icon={<Video className="h-5 w-5" aria-hidden="true" />}
                title="Create a room"
                body="Pick your language and theirs. Captions are on; transcripts and recording stay off unless you say otherwise."
              />
              <Step
                icon={<Link2 className="h-5 w-5" aria-hidden="true" />}
                title="Share the link"
                body="Send it over WhatsApp or anywhere else. The other person opens it in a browser — no install, minimal friction."
              />
              <Step
                icon={
                  <MessageSquareText className="h-5 w-5" aria-hidden="true" />
                }
                title="Talk naturally"
                body="Speak in your own language. Live captions appear on each side, translated in real time as you go."
              />
            </div>
          </div>
        </section>

        {/* Privacy strip */}
        <section className="mx-auto w-full max-w-6xl px-5 py-16">
          <div className="rounded-2xl border border-line bg-surface-2 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Private by default
            </h2>
            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
              <PrivacyItem
                term="Nothing saved unless you choose"
                detail="Transcript saving and recording are off by default — captions can be ephemeral."
              />
              <PrivacyItem
                term="30-day hard cap"
                detail="When you do save transcripts or recordings, retention never exceeds 30 days."
              />
              <PrivacyItem
                term="Consent up front"
                detail="Before anyone joins, the room states exactly what's translated, saved, or recorded."
              />
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted">
          <span>
            LinguaBridge · built for real conversations across borders
          </span>
          <span className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

function Step({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-background p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-accent">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function PrivacyItem({ term, detail }: { term: string; detail: string }) {
  return (
    <div>
      <dt className="font-medium text-foreground">{term}</dt>
      <dd className="mt-1 leading-relaxed text-muted">{detail}</dd>
    </div>
  );
}
