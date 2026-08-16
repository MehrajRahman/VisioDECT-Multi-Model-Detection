import Link from "next/link";
import type { Metadata } from "next";
import {
  getLabelEfficiency,
  breakEvenRho,
  toPct,
  efficiencySteps,
  efficiencyKnee,
  closestApproach,
} from "@/lib/partb";
import type { ClosestApproach } from "@/lib/partb-types";
import LabelEfficiencyChart from "@/components/LabelEfficiencyChart";
import AwaitingOutput from "@/components/AwaitingOutput";

export const metadata: Metadata = {
  title: "Label efficiency · VisioDECT",
  description:
    "How detection performance scales with the bounding-box label budget, for DINOv3-initialised and COCO-initialised backbones.",
};

export default function LabelEfficiencyPage() {
  const data = getLabelEfficiency();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        {/* The nav lists Part B once; these pages link back to the hub. */}
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Bonus ablation
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          How far does the label budget stretch?
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          The same detector fine-tuned at five label fractions from two starting points, so the
          question stops being &ldquo;does SSL help at 20%?&rdquo; and becomes &ldquo;how many
          annotations does SSL buy back?&rdquo;
        </p>
      </header>

      {data === null ? (
        <AwaitingOutput
          title="Ablation results haven't been extracted yet"
          file="partb_label_efficiency.json"
          detail="Download the bonus_runs/ JSONs from the Kaggle bonus notebook first. Partial grids are fine — the chart plots whatever cells exist."
        />
      ) : (
        <LabelEfficiencyContent data={data} />
      )}
    </main>
  );
}

function LabelEfficiencyContent({
  data,
}: Readonly<{ data: NonNullable<ReturnType<typeof getLabelEfficiency>> }>) {
  const referenceValue = data.reference?.test_mAP50_95 ?? null;
  const sslSeries = data.series.find((s) => s.init === "dinov3");
  const cocoSeries = data.series.find((s) => s.init === "coco");

  // Two break-even questions the brief asks for. Both return null when no
  // measured cell clears the bar -- we do not interpolate a crossing point
  // between runs that were never trained.
  const cocoAtHalf = cocoSeries?.points.find((p) => p.rho === 0.5)?.test_mAP50_95 ?? null;
  const beatsCocoHalf = breakEvenRho(sslSeries?.points ?? [], cocoAtHalf);
  const ninetyFive = typeof referenceValue === "number" ? referenceValue * 0.95 : null;
  const beatsNinetyFive = breakEvenRho(sslSeries?.points ?? [], ninetyFive);

  // When a threshold is never cleared, report how near the curve got rather
  // than only that it failed -- see closestApproach() for why.
  const nearCoco = closestApproach(sslSeries?.points ?? [], cocoAtHalf);
  const nearNinetyFive = closestApproach(sslSeries?.points ?? [], ninetyFive);

  const complete = data.grid.present_cells >= data.grid.expected_cells;

  // Shared with the Part B hub so both quote the same knee.
  const steps = efficiencySteps(sslSeries);
  const knee = efficiencyKnee(steps);

  return (
    <>
      {knee && sslSeries && (
        <section className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.06] p-6 sm:p-8">
          <p className="text-lg font-semibold leading-relaxed text-slate-100 sm:text-xl">
            Above ρ = {knee.from.toFixed(2)}, extra annotation stops paying for itself.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            Going from ρ = {steps[0].from.toFixed(2)} to {steps[0].to.toFixed(2)} is worth{" "}
            <span className="font-semibold tabular-nums text-blue-400">
              +{steps[0].gain.toFixed(2)} pp
            </span>
            , but {knee.from.toFixed(2)} → {knee.to.toFixed(2)} is worth only{" "}
            <span className="font-semibold tabular-nums text-blue-400">
              +{knee.gain.toFixed(2)} pp
            </span>
            . For a deployment on this dataset, annotating past ~{(knee.from * 100).toFixed(0)}% of
            the images buys very little detection quality — which is the practical form of the
            question Part B set out to answer.
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
            {steps.map((s) => (
              <div key={`${s.from}-${s.to}`}>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  {s.from.toFixed(2)} → {s.to.toFixed(2)}
                </dt>
                <dd
                  className={`mt-1 text-xl font-bold tabular-nums ${
                    s.gain < steps[0].gain / 3 ? "text-slate-500" : "text-blue-400"
                  }`}
                >
                  {s.gain >= 0 ? "+" : ""}
                  {s.gain.toFixed(2)} pp
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="space-y-4">
        <LabelEfficiencyChart series={data.series} reference={data.reference} />

        {!complete && (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Grid {data.grid.present_cells} of {data.grid.expected_cells} complete.
            </span>{" "}
            Gaps in a line are cells that have not finished training — they are not
            interpolated. Missing: {data.grid.missing_cells.join(", ")}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <BreakEvenCard
          question={`Where does ${sslSeries?.label ?? "SSL"}-init match COCO-init at ρ = 0.50?`}
          rho={beatsCocoHalf}
          unavailable={
            cocoAtHalf === null
              ? "The COCO ρ = 0.50 cell hasn't finished, so there's no bar to clear yet."
              : "No measured SSL cell reaches it yet."
          }
          target={cocoAtHalf !== null ? `${toPct(cocoAtHalf)} test mAP50-95` : null}
          closest={nearCoco}
        />
        <BreakEvenCard
          question="Where does it reach 95% of the full-label reference?"
          rho={beatsNinetyFive}
          unavailable={
            ninetyFive === null
              ? "No 100%-label reference has been extracted, so the threshold is undefined."
              : "No measured SSL cell reaches it yet."
          }
          target={ninetyFive !== null ? `${toPct(ninetyFive)} test mAP50-95` : null}
          closest={nearNinetyFive}
        />
      </section>

      {data.series
        .filter((s) => s.caveat)
        .map((s) => (
          <p
            key={s.init}
            className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-200/90"
          >
            <span className="font-semibold">Read {s.label} with care. </span>
            {s.caveat}
          </p>
        ))}
    </>
  );
}

function BreakEvenCard({
  question,
  rho,
  target,
  unavailable,
  closest,
}: Readonly<{
  question: string;
  rho: number | null;
  target: string | null;
  unavailable: string;
  closest: ClosestApproach | null;
}>) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-6">
      <p className="text-sm font-medium text-slate-300">{question}</p>
      {rho !== null ? (
        <>
          <p className="mt-3 text-4xl font-black tracking-tight text-blue-400">
            ρ = {rho.toFixed(2)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Smallest measured label fraction clearing {target}.
          </p>
        </>
      ) : closest ? (
        <>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-300">
            Not reached — short by{" "}
            <span className="tabular-nums text-amber-400">
              {closest.shortfallPp.toFixed(2)} pp
            </span>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            The closest measured run is ρ = {(closest.point.rho ?? 0).toFixed(2)} at{" "}
            {toPct(closest.point.test_mAP50_95)}, attaining{" "}
            <span className="font-semibold tabular-nums text-slate-200">
              {(closest.attained * 100).toFixed(1)}%
            </span>{" "}
            of the {target} bar.
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-500">Not yet reached</p>
          <p className="mt-2 text-xs text-slate-500">{unavailable}</p>
        </>
      )}
    </div>
  );
}
