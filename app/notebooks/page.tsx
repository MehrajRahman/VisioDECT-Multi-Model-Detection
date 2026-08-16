import Link from "next/link";
import type { Metadata } from "next";
import { getNotebookEvidence } from "@/lib/partb";
import { NOTEBOOKS, CORE_COUNT, NotebookEntry } from "@/lib/kaggle-notebooks";

export const metadata: Metadata = {
  title: "Notebooks · VisioDECT",
  description:
    "Every Kaggle notebook behind Part A and Part B, with the submission checklist and which runs are evidenced in the extracted outputs.",
};

export default function NotebooksPage() {
  const evidence = getNotebookEvidence();
  const declared = new Set((evidence?.declared ?? []).map((d) => d.notebook));
  const artefactCount = new Map(
    (evidence?.declared ?? []).map((d) => [d.notebook, d.artefacts] as const)
  );
  // owner/slug pairs recovered from Kaggle input paths -- these are real URLs,
  // not guesses, so they can fill a gap in the registry automatically.
  const resolved = evidence?.resolved ?? [];

  function resolvedFor(entry: NotebookEntry) {
    if (entry.url) return null;
    const needle = entry.no.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      resolved.find((r) => r.slug.toLowerCase().replace(/[^a-z0-9]/g, "").includes(`notebook${needle}`)) ??
      null
    );
  }

  const partA = NOTEBOOKS.filter((n) => n.part === "A");
  const partB = NOTEBOOKS.filter((n) => n.part === "B");
  const ablation = NOTEBOOKS.filter((n) => n.part === "ablation");

  const linked = NOTEBOOKS.filter((n) => n.url ?? resolvedFor(n)).length;
  const evidenced = NOTEBOOKS.filter((n) => n.declaredAs && declared.has(n.declaredAs)).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Notebooks
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Kaggle notebooks
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Every notebook behind both parts of the study. The submission checklist requires a public
          link for each core notebook, so this page tracks which are published and which still need
          one.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Public links present"
          value={`${linked} / ${NOTEBOOKS.length}`}
          tone={linked >= CORE_COUNT ? "good" : "warn"}
          detail={`${CORE_COUNT} core notebooks required; the bonus is optional.`}
        />
        <Stat
          label="Runs evidenced in outputs"
          value={String(evidenced)}
          tone="neutral"
          detail="Notebooks that stamped their own name onto an extracted result file."
        />
        <Stat
          label="URLs recovered automatically"
          value={String(resolved.length)}
          tone="neutral"
          detail="From /kaggle/input/notebooks/… paths, where one notebook attached another's output."
        />
      </section>

      {linked < NOTEBOOKS.length && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-200/90">
          <span className="font-semibold">
            {NOTEBOOKS.length - linked} notebook{NOTEBOOKS.length - linked === 1 ? "" : "s"} still
            need a public URL.{" "}
          </span>
          Paste them into{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5">lib/kaggle-notebooks.ts</code>. Names
          declared in the run outputs are shown below as evidence a notebook ran, but a declared
          name is not a link — none are guessed into URLs, because a fabricated link that 404s
          during marking is worse than a visible gap.
        </p>
      )}

      <NotebookSection
        title="Part A — supervised baseline"
        subtitle="Five notebooks. All published."
        entries={partA}
        declared={declared}
        artefactCount={artefactCount}
        resolvedFor={resolvedFor}
      />

      <NotebookSection
        title="Part B — self-supervised extension"
        subtitle="Nine core notebooks plus the optional bonus ablation."
        entries={partB}
        declared={declared}
        artefactCount={artefactCount}
        resolvedFor={resolvedFor}
      />

      {ablation.length > 0 && (
        <NotebookSection
          title="Pretraining ablation"
          subtitle={`${ablation.length} additional notebooks, one per configuration. Beyond the brief's required inventory.`}
          entries={ablation}
          declared={declared}
          artefactCount={artefactCount}
          resolvedFor={resolvedFor}
        />
      )}

      {resolved.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Checkpoint hand-offs found in the outputs
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
            These notebooks were attached as Kaggle dataset inputs to another notebook, which is
            what the brief&apos;s checkpoint hand-off pattern requires. The paths are recorded in
            the run JSONs, so these links are traceable rather than transcribed.
          </p>
          <ul className="space-y-2">
            {resolved.map((r) => (
              <li
                key={r.slug}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#0d1122] px-4 py-3"
              >
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-400 hover:text-blue-300"
                >
                  {r.slug}
                </a>
                <span className="text-xs text-slate-500">owner: {r.owner}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function NotebookSection({
  title,
  subtitle,
  entries,
  declared,
  artefactCount,
  resolvedFor,
}: Readonly<{
  title: string;
  subtitle: string;
  entries: NotebookEntry[];
  declared: Set<string>;
  artefactCount: Map<string, number>;
  resolvedFor: (e: NotebookEntry) => { url: string; slug: string } | null;
}>) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">{title}</h2>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <ul className="space-y-3">
        {entries.map((entry) => {
          const auto = resolvedFor(entry);
          const href = entry.url ?? auto?.url ?? null;
          const ran = entry.declaredAs ? declared.has(entry.declaredAs) : false;
          const artefacts = entry.declaredAs ? artefactCount.get(entry.declaredAs) : undefined;

          const body = (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs font-bold text-blue-400">
                  {entry.no}
                </span>
                <h3 className="text-base font-bold tracking-tight text-slate-100">{entry.title}</h3>
                {entry.optional && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Bonus
                  </span>
                )}
                {ran && (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Output verified{typeof artefacts === "number" && artefacts > 1 && ` ×${artefacts}`}
                  </span>
                )}
                {auto && (
                  <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                    URL auto-recovered
                  </span>
                )}
                {!href && (
                  <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                    URL needed
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{entry.content}</p>
              {entry.declaredAs && (
                <p className="mt-2 font-mono text-xs text-slate-600">{entry.declaredAs}</p>
              )}
            </>
          );

          return (
            <li key={entry.no}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border border-white/10 bg-[#0d1122] p-5 transition-colors hover:border-blue-500/40"
                >
                  {body}
                  <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-blue-400">
                    Open on Kaggle →
                  </span>
                </a>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5">
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Stat({
  label,
  value,
  detail,
  tone,
}: Readonly<{ label: string; value: string; detail: string; tone: "good" | "warn" | "neutral" }>) {
  const accent =
    tone === "good" ? "text-emerald-400" : tone === "warn" ? "text-amber-400" : "text-blue-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black tabular-nums tracking-tight ${accent}`}>{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{detail}</p>
    </div>
  );
}
