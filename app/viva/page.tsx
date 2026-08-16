import Link from "next/link";
import type { Metadata } from "next";
import { VIVA_SECTIONS } from "@/lib/viva-questions";

export const metadata: Metadata = {
  title: "Viva Preparation · VisioDECT",
  description:
    "Every viva question from the Part B brief, mapped to the evidence on this dashboard that supports the answer.",
};

export default function VivaPage() {
  const total = VIVA_SECTIONS.reduce((n, s) => n + s.questions.length, 0);
  const withEvidence = VIVA_SECTIONS.reduce(
    (n, s) => n + s.questions.filter((q) => q.evidence).length,
    0
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Viva
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Viva preparation
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          All {total} questions from the assignment brief, grouped by notebook. Every member is
          answerable for every notebook, so this is arranged for cross-reading rather than by who
          wrote what.
        </p>
        <p className="max-w-3xl rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-200">No answers are written here — deliberately. </span>
          {withEvidence} of the {total} questions link to the measurement on this dashboard that
          settles them, and several carry a note on what the answer has to engage with. Reciting
          prose is what the viva is designed to catch; arguing from your own numbers is what it
          rewards.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {VIVA_SECTIONS.map((section) => (
          <a
            key={section.notebook}
            href={`#nb-${section.notebook.replace(/[^a-z0-9]/gi, "")}`}
            className="rounded-lg border border-white/10 bg-[#0d1122] px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-blue-500/40 hover:text-blue-400"
          >
            <span className="font-mono text-slate-500">{section.notebook}</span> {section.title}
          </a>
        ))}
      </nav>

      {VIVA_SECTIONS.map((section) => (
        <section
          key={section.notebook}
          id={`nb-${section.notebook.replace(/[^a-z0-9]/gi, "")}`}
          className="scroll-mt-24 space-y-4"
        >
          <h2 className="flex items-baseline gap-3 text-lg font-bold tracking-tight text-slate-100">
            <span className="font-mono text-sm text-blue-400">{section.notebook}</span>
            {section.title}
          </h2>
          <ol className="space-y-3">
            {section.questions.map((question, i) => (
              <li
                key={question.q}
                className="rounded-2xl border border-white/10 bg-[#0d1122] p-5"
              >
                <div className="flex gap-4">
                  <span className="shrink-0 font-mono text-sm text-slate-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 space-y-3">
                    <p className="text-sm leading-relaxed text-slate-200">{question.q}</p>
                    {question.prompt && (
                      <p className="text-sm leading-relaxed text-slate-400">
                        <span className="font-semibold text-slate-300">What it&apos;s testing: </span>
                        {question.prompt}
                      </p>
                    )}
                    {question.evidence && (
                      <Link
                        href={question.evidence.href}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/[0.08] px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:border-blue-500/40"
                      >
                        Evidence: {question.evidence.label} →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
