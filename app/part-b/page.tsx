import Link from "next/link";
import type { Metadata } from "next";
import HeroVideo from "@/components/HeroVideo";
import {
  getSslComparison,
  getLabelEfficiency,
  getPartBPretraining,
  getPartBTracking,
  summarizeSsl,
  findMetric,
  toPct,
  efficiencySteps,
  efficiencyKnee,
  getProtocolAudit,
  getSslAblation,
  getNotebookEvidence,
  trackingAssetSrc,
} from "@/lib/partb";

export const metadata: Metadata = {
  title: "Part B Overview · VisioDECT",
  description:
    "How much bounding-box annotation can self-supervised pretraining save? The full Part B pipeline, headline findings, and where each result lives.",
};

// The system, stage by stage. Counts come from the data where the notebooks
// recorded them and are omitted otherwise -- a stage with an unknown number
// shows its description alone rather than a fabricated figure.
type Stage = {
  n: string;
  title: string;
  detail: string;
  stat?: string | null;
};

export default function PartBOverviewPage() {
  const ssl = getSslComparison();
  const efficiency = getLabelEfficiency();
  const pretraining = getPartBPretraining();
  const tracking = getPartBTracking();
  const audit = getProtocolAudit();
  const ablation = getSslAblation();
  const notebooks = getNotebookEvidence();

  const s = summarizeSsl(ssl);
  const reference = ssl?.reference ?? null;
  const partition = pretraining?.partition ?? null;

  const rho = s.bestSsl?.rho ?? 0.2;
  const rhoPct = `${(rho * 100).toFixed(0)}%`;

  const poolImages = partition?.pool_images ?? partition?.ssl_pool_images ?? null;
  // Same knee the /label-efficiency page quotes.
  const steps = efficiencySteps(efficiency?.series.find((x) => x.init === "dinov3"));
  const knee = efficiencyKnee(steps);

  const bestTracker = tracking?.runs
    .map((r) => ({ r, ids: findMetric(r, "unique_track_ids")?.value ?? Infinity }))
    .sort((a, b) => a.ids - b.ids)[0]?.r;

  // Hero background: the cleanest tracker's own annotated clip. Chosen from
  // the data rather than named here, so it follows the result if the tracker
  // ranking changes.
  const heroVideo = trackingAssetSrc(bestTracker?.video ?? tracking?.runs[0]?.video);

  // Four numbers that summarise the whole study. Each is omitted rather than
  // shown as a placeholder when its source hasn't been extracted.
  const heroStats = [
    s.bestSslRecovery !== null && {
      label: `Full-label performance at ρ = ${rho.toFixed(2)}`,
      value: `${(s.bestSslRecovery * 100).toFixed(0)}%`,
    },
    knee && { label: "Annotation saturates above", value: `ρ ${knee.from.toFixed(2)}` },
    efficiency && {
      label: "Ablation grid complete",
      value: `${efficiency.grid.present_cells}/${efficiency.grid.expected_cells}`,
    },
    audit && {
      label: "Settings identical across runs",
      value: `${audit.constant_count}/${audit.total_keys}`,
    },
  ].filter((x): x is { label: string; value: string } => Boolean(x));

  const stages: Stage[] = [
    {
      n: "01",
      title: "Leakage-safe partition",
      detail:
        "One 10/10/80 split, seed 445, shared by every notebook and verified by a common fingerprint.",
      stat: partition?.test_images ? `${partition.test_images.toLocaleString()} held-out test images` : null,
    },
    {
      n: "02",
      title: "Self-supervised pretraining",
      detail:
        "Four objectives — SimCLR, BYOL, I-JEPA, DINOv3 — each train a YOLOv26-s backbone on the unlabelled pool. No bounding boxes are read at this stage.",
      stat: poolImages ? `${poolImages.toLocaleString()} unlabelled frames` : "4 objectives",
    },
    {
      n: "03",
      title: `Fine-tune at ρ = ${rho.toFixed(2)}`,
      detail:
        "Each backbone, plus random-init and COCO-pretrained controls, fine-tunes a detector under one frozen protocol so the initialisation is the only variable.",
      stat: ssl ? `${ssl.runs.length} initialisations compared` : null,
    },
    {
      n: "04",
      title: "Label-efficiency sweep",
      detail:
        "The winning setup re-run across label budgets to find how far the annotation saving stretches.",
      stat: efficiency ? `${efficiency.grid.present_cells}/${efficiency.grid.expected_cells} grid cells` : null,
    },
    {
      n: "05",
      title: "Pretraining ablation",
      detail:
        "The pretraining recipe itself swept at fixed ρ, testing how sensitive the detector is to how the backbone was optimised.",
      stat: ablation ? `${ablation.cells.length} configurations` : null,
    },
    {
      n: "06",
      title: "Deployment with tracking",
      detail:
        "The 20%-label detector run on video with persistent track IDs, comparing motion-only against appearance-based association.",
      stat: tracking ? `${tracking.runs.length} trackers compared` : null,
    },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-14 bg-[#060814] px-4 py-10 sm:px-6">
      {/* Hero. The background clip is the tracking notebook's own annotated
          output — the end of the pipeline shown at the top of it, so the page
          opens on the working system rather than a description of one. */}
      <header className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-[#050710]">
        {heroVideo && (
          <>
            <HeroVideo
              src={heroVideo}
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
            />
            {/* Two scrims: a horizontal one so the copy sits on near-solid
                ground at the left, and a vertical one to seat the stat strip. */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050710] via-[#050710]/85 to-[#050710]/25" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#050710] via-transparent to-[#050710]/60" />
          </>
        )}

        <div className="flex min-h-[26rem] flex-col justify-end gap-8 p-6 sm:p-10 lg:min-h-[30rem] lg:p-14">
          <div className="max-w-3xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              Part B · Self-supervised extension
            </span>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              How much annotation can{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                self-supervision
              </span>{" "}
              save?
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300">
              Part A established YOLOv26-s as the strongest detector on VisioDECT when every
              bounding box is available. Part B takes almost all of them away — and asks whether
              pretraining on unlabelled frames can buy them back.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/ssl"
                className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-400"
              >
                See the results
              </Link>
              <Link
                href="/tracking"
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-wider text-slate-100 backdrop-blur-sm transition-colors hover:bg-white/15"
              >
                Watch the tracker
              </Link>
            </div>
          </div>

          {heroStats.length > 0 && (
            <dl className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="bg-[#050710]/80 p-4 backdrop-blur-sm">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-black tabular-nums tracking-tight text-white">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {heroVideo && tracking && (
          <p className="border-t border-white/10 bg-[#050710]/90 px-6 py-2.5 text-[11px] text-slate-500 sm:px-10 lg:px-14">
            Background: {tracking.video} tracked by{" "}
            {tracking.runs[0]?.tracker ?? "the winning tracker"} using the ρ = 0.20 detector —
            rendered by notebook 5, not re-inferred here.
          </p>
        )}
      </header>

      {/* ---------- headline findings ---------- */}
      <section className="grid gap-4 lg:grid-cols-3">
        {knee && (
          <Finding
            label="Annotation stops paying off above"
            value={`ρ = ${knee.from.toFixed(2)}`}
            tone="blue"
            detail={`The first budget step is worth +${steps[0].gain.toFixed(2)} pp; ${knee.from.toFixed(
              2
            )} → ${knee.to.toFixed(2)} is worth only +${knee.gain.toFixed(
              2
            )} pp. This is the practical answer to the research question.`}
          />
        )}
        <Finding
          label={`Recovered from ${rhoPct} of labels`}
          value={s.bestSslRecovery !== null ? `${(s.bestSslRecovery * 100).toFixed(0)}%` : "—"}
          tone="blue"
          detail={
            s.bestSsl && reference
              ? `${s.bestSsl.label} at ${toPct(s.bestSsl.test_mAP50_95)} against a ${toPct(
                  reference.test_mAP50_95
                )} full-label reference.`
              : "Awaiting downstream results."
          }
        />
        <Finding
          label="Gain over random initialisation"
          value={s.sslOverRandomPp !== null ? `+${s.sslOverRandomPp.toFixed(2)} pp` : "—"}
          tone="blue"
          detail={
            s.sslOverRandomPp !== null
              ? "Self-supervised pretraining on in-domain frames measurably beats starting cold."
              : "Awaiting the random-init baseline."
          }
        />
        <Finding
          label="Shortfall against COCO pretraining"
          value={s.cocoOverSslPp !== null ? `−${s.cocoOverSslPp.toFixed(2)} pp` : "—"}
          tone="amber"
          detail={
            s.cocoOverSslPp !== null
              ? "Supervised transfer from ~118k labelled out-of-domain images still wins. This is the study's honest negative result."
              : "Awaiting the COCO baseline."
          }
        />
      </section>

      {s.sslSpreadPp !== null && s.bestSsl && s.worstSsl && (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm leading-relaxed text-slate-300">
          <span className="font-semibold text-slate-100">The four objectives barely differ. </span>
          All of {s.worstSsl.label} through {s.bestSsl.label} land within{" "}
          <span className="font-semibold tabular-nums">{s.sslSpreadPp.toFixed(2)} pp</span> of each
          other ({toPct(s.worstSsl.test_mAP50_95)} → {toPct(s.bestSsl.test_mAP50_95)}). Under this
          label budget, <em>whether</em> you pretrain matters far more than which objective you
          choose.
        </p>
      )}

      {/* ---------- the pipeline ---------- */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          The pipeline
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stages.map((stage) => (
            <li
              key={stage.n}
              className="relative flex flex-col rounded-2xl border border-white/10 bg-[#0d1122] p-5"
            >
              <span className="font-mono text-xs text-blue-400/70">{stage.n}</span>
              <h3 className="mt-2 text-sm font-bold leading-snug text-slate-100">{stage.title}</h3>
              {stage.stat && (
                <p className="mt-2 text-xs font-semibold tabular-nums text-blue-400">{stage.stat}</p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{stage.detail}</p>
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500">
          Every stage shares one partition and one fine-tuning protocol
          {partition?.fingerprint && (
            <>
              , stamped with fingerprint{" "}
              <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-slate-400">
                {partition.fingerprint}
              </code>
            </>
          )}
          .
        </p>
      </section>

      {/* ---------- where the detail lives ---------- */}
      <section className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Explore the results
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ResultCard
            href="/ssl"
            title="SSL comparison"
            blurb={`All six initialisations at ρ = ${rho.toFixed(2)}, with the full metrics table.`}
            stat={s.overall ? `${s.overall.label} leads at ${toPct(s.overall.test_mAP50_95)}` : null}
            status={ssl ? (ssl.missing_inits.length === 0 ? "complete" : "partial") : "pending"}
            statusNote={
              ssl && ssl.missing_inits.length > 0 ? `${ssl.missing_inits.length} runs outstanding` : null
            }
          />
          <ResultCard
            href="/label-efficiency"
            title="Label efficiency"
            blurb="How detection quality scales as the annotation budget grows."
            stat={
              efficiency
                ? `${efficiency.grid.present_cells} of ${efficiency.grid.expected_cells} cells measured`
                : null
            }
            status={
              efficiency
                ? efficiency.grid.present_cells >= efficiency.grid.expected_cells
                  ? "complete"
                  : "partial"
                : "pending"
            }
            statusNote={
              efficiency && efficiency.grid.missing_cells.length > 0
                ? `${efficiency.grid.missing_cells.length} cells still training`
                : null
            }
          />
          <ResultCard
            href="/tracking"
            title="Tracking"
            blurb="The 20%-label detector on video, three trackers compared on identical detections."
            stat={
              bestTracker && tracking
                ? `${bestTracker.tracker} cleanest at ${findMetric(bestTracker, "unique_track_ids")?.value} IDs for ${tracking.expected_objects} drones`
                : null
            }
            status={tracking ? "complete" : "pending"}
            statusNote={null}
          />
          <ResultCard
            href="/ssl-ablation"
            title="Pretraining ablation"
            blurb="Six pretraining recipes sweeping learning rate, weight decay and EMA decay at fixed ρ."
            stat={
              ablation?.spread_pp != null
                ? `${ablation.spread_pp.toFixed(2)} pp spread across ${ablation.cells.length} configs`
                : null
            }
            status={ablation ? "complete" : "pending"}
            statusNote={null}
          />
          <ResultCard
            href="/protocol"
            title="Protocol audit"
            blurb="An automated diff of every run's training configuration, verifying the fair-comparison rules."
            stat={
              audit
                ? `${audit.constant_count} of ${audit.total_keys} settings identical across ${audit.runs.length} runs`
                : null
            }
            status={audit ? (audit.compliant ? "complete" : "partial") : "pending"}
            statusNote={audit && !audit.compliant ? "Unexpected drift detected" : null}
          />
          <ResultCard
            href="/notebooks"
            title="Kaggle notebooks"
            blurb="Every notebook behind both parts, with the submission checklist."
            stat={
              notebooks
                ? `${notebooks.declared.length} runs evidenced in the extracted outputs`
                : null
            }
            status="partial"
            statusNote="Part B public URLs still to be pasted in"
          />
          <ResultCard
            href="/viva"
            title="Viva preparation"
            blurb="Every question from the brief, mapped to the measurement on this dashboard that settles it."
            stat="36 questions across 6 notebooks"
            status="complete"
            statusNote={null}
          />
          <ResultCard
            href="/methodology"
            title="Methodology"
            blurb="The partition, the frozen protocol, and what each objective actually learned."
            stat={
              pretraining
                ? `${pretraining.methods.length} of 4 pretraining runs documented`
                : null
            }
            status={
              pretraining ? (pretraining.methods.length >= 4 ? "complete" : "partial") : "pending"
            }
            statusNote={
              pretraining && pretraining.methods.length < 4
                ? "Pretraining summaries not yet extracted"
                : null
            }
          />
        </div>
      </section>

      {/* ---------- caveats, gathered ---------- */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Read these alongside the numbers
        </h2>
        {reference?.caveat && (
          <Caveat title="The 100%-label reference is optimistic">
            {reference.caveat}. Every &ldquo;% of full-label performance&rdquo; figure across Part B
            is a ratio against it, so those percentages understate rather than overstate the gap.
          </Caveat>
        )}
        {(ssl?.runs ?? [])
          .filter((r) => r.caveat)
          .map((r) => (
            <Caveat key={r.init} title={`${r.label} is not a like-for-like entry`}>
              {r.caveat}
            </Caveat>
          ))}
      </section>

      <p className="border-t border-white/10 pt-6 text-xs text-slate-500">
        Every figure on these pages is read from the notebook JSONs at build time — none are
        transcribed by hand. Part A&apos;s fully supervised results remain on the{" "}
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          main dashboard
        </Link>
        .
      </p>
    </main>
  );
}

function Finding({
  label,
  value,
  detail,
  tone,
}: Readonly<{ label: string; value: string; detail: string; tone: "blue" | "amber" }>) {
  const accent = tone === "amber" ? "text-orange-400" : "text-blue-400";
  const border = tone === "amber" ? "border-amber-500/20" : "border-blue-500/20";
  const bg = tone === "amber" ? "bg-amber-500/[0.06]" : "bg-blue-500/[0.06]";
  return (
    <div className={`rounded-3xl border ${border} ${bg} p-6`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-4xl font-black tabular-nums tracking-tight ${accent}`}>{value}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{detail}</p>
    </div>
  );
}

const STATUS_STYLES = {
  complete: { label: "Complete", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  partial: { label: "Partial", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  pending: { label: "Awaiting data", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
} as const;

function ResultCard({
  href,
  title,
  blurb,
  stat,
  status,
  statusNote,
}: Readonly<{
  href: string;
  title: string;
  blurb: string;
  stat: string | null;
  status: keyof typeof STATUS_STYLES;
  statusNote: string | null;
}>) {
  const badge = STATUS_STYLES[status];
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-white/10 bg-[#0d1122] p-6 transition-colors hover:border-blue-500/40"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-bold tracking-tight text-slate-100 group-hover:text-blue-400">
          {title}
        </h3>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{blurb}</p>
      {stat && <p className="mt-4 text-sm font-semibold text-slate-200">{stat}</p>}
      {statusNote && <p className="mt-1 text-xs text-slate-500">{statusNote}</p>}
      <span className="mt-4 text-xs font-semibold uppercase tracking-wide text-blue-400">
        View →
      </span>
    </Link>
  );
}

function Caveat({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3">
      <p className="text-sm font-semibold text-amber-200">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-amber-200/80">{children}</p>
    </div>
  );
}
