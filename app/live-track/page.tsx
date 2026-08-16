import Link from "next/link";
import type { Metadata } from "next";
import LiveTrackDemo from "@/components/LiveTrackDemo";

export const metadata: Metadata = {
  title: "Live Tracking · VisioDECT",
  description:
    "Upload a short clip and run multi-object tracking on the deployed inference Space, with boxes rendered in the browser.",
};

export default function LiveTrackPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-8 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <Link
          href="/tracking"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Tracking
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Live tracking on your own clip
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Upload a short video and the deployed Space runs detection and association on it, then
          returns the track rows. The boxes you see are drawn here in the browser from those rows.
        </p>
      </header>

      <LiveTrackDemo />

      <section className="grid gap-4 lg:grid-cols-3">
        <Note title="Why it returns data, not video">
          Re-encoding an annotated MP4 on the Space costs more GPU time than the tracking itself and
          doubles the transfer in both directions. Returning ~35 KB of rows instead removes the
          encode step entirely, and the browser can then swap trackers or scrub without re-running
          anything.
        </Note>
        <Note title="Why it may take 20–40 seconds">
          Most of that is upload, decode and queueing, not inference — the tracking itself is a few
          seconds. A ZeroGPU Space also cold-starts if it has been idle, so the first run of a
          session is the slowest.
        </Note>
        <Note title="Why clips are capped">
          Length is checked in the browser and again on the Space before any GPU is reserved, so an
          over-long clip is rejected without consuming quota. Repeat runs of the same file are
          served from cache and cost nothing.
        </Note>
      </section>

      <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-400">
        <span className="font-semibold text-slate-200">For a guaranteed demo, use{" "}
          <Link href="/tracking" className="text-blue-400 hover:text-blue-300">
            /tracking
          </Link>{" "}
          instead.
        </span>{" "}
        That page plays the study&apos;s own clip with the same overlay entirely offline — no GPU, no
        network, nothing that can fail on venue wifi. This page is the live counterpart, and depends
        on the Space being up and in quota.
      </p>
    </main>
  );
}

function Note({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
      <h2 className="text-sm font-bold text-slate-100">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}
