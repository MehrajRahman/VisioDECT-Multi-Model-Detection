import Link from "next/link";
import type { Metadata } from "next";
import { getSslComparison, summarizeSsl, toPct } from "@/lib/partb";
import SslCompareChart from "@/components/SslCompareChart";
import SslResultsTable from "@/components/SslResultsTable";
import AwaitingOutput from "@/components/AwaitingOutput";

export const metadata: Metadata = {
  title: "SSL comparison · VisioDECT",
  description:
    "Four self-supervised pretraining methods compared against random and COCO initialisation at a 20% bounding-box label budget.",
};

export default function SslPage() {
  const data = getSslComparison();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        {/* The nav lists Part B once; these pages link back to the hub. */}
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Task 1
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Self-supervised pretraining at a 20% label budget
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          Each initialisation pretrains a YOLOv26-s backbone on the unlabelled 80% pool, then
          fine-tunes the detector on 20% of the bounding-box annotations. All six runs share the
          same frozen fine-tuning protocol, so the only variable is where the backbone weights
          came from.
        </p>
      </header>

      {data === null ? (
        <AwaitingOutput
          title="SSL comparison results haven't been extracted yet"
          file="partb_ssl_comparison.json"
          detail="Download the partB_downstream/ JSONs from the Kaggle notebooks first."
        />
      ) : (
        <SslContent data={data} />
      )}
    </main>
  );
}

function pp(points: number | null): string {
  return points !== null ? `${points.toFixed(2)} pp` : "—";
}

function SslContent({ data }: Readonly<{ data: NonNullable<ReturnType<typeof getSslComparison>> }>) {
  const reference = data.reference;
  // Shared with the Part B overview so the two pages can't drift apart.
  const { bestSsl, worstSsl, random, coco, overall, bestSslRecovery, sslOverRandomPp, cocoOverSslPp, sslSpreadPp } =
    summarizeSsl(data);
  const sslBeatsRandom = sslOverRandomPp !== null && sslOverRandomPp > 0;
  const cocoBeatsSsl = cocoOverSslPp !== null && cocoOverSslPp > 0;

  return (
    <>
      {bestSsl && (
        <section className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.06] p-6 sm:p-8">
          <p className="text-lg font-semibold leading-relaxed text-slate-100 sm:text-xl">
            {bestSslRecovery !== null ? (
              <>
                Self-supervised pretraining on 16k unlabelled in-domain frames recovers{" "}
                <span className="text-blue-400">{(bestSslRecovery * 100).toFixed(0)}%</span> of
                full-label detection performance from{" "}
                <span className="text-blue-400">
                  {typeof bestSsl.rho === "number" ? `${(bestSsl.rho * 100).toFixed(0)}%` : "a fraction"}
                </span>{" "}
                of the bounding-box annotations — but does not overtake supervised COCO
                pretraining.
              </>
            ) : (
              <>
                {bestSsl.label} is the strongest self-supervised initialisation at{" "}
                <span className="text-blue-400">{toPct(bestSsl.test_mAP50_95)}</span> test mAP50-95.
              </>
            )}
          </p>

          <dl className="mt-6 grid gap-5 sm:grid-cols-3">
            {sslBeatsRandom && bestSsl && random && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Best SSL over random init
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-blue-400">
                  +{pp(sslOverRandomPp)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  {bestSsl.label} {toPct(bestSsl.test_mAP50_95)} vs {toPct(random.test_mAP50_95)}
                </dd>
              </div>
            )}
            {cocoBeatsSsl && coco && bestSsl && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  COCO still ahead by
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-orange-400">
                  +{pp(cocoOverSslPp)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  {toPct(coco.test_mAP50_95)} — supervised, ~118k labelled out-of-domain images
                </dd>
              </div>
            )}
            {sslSpreadPp !== null && bestSsl && worstSsl && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">
                  Spread across all four SSL methods
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-200">
                  {pp(sslSpreadPp)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  {worstSsl.label} {toPct(worstSsl.test_mAP50_95)} → {bestSsl.label}{" "}
                  {toPct(bestSsl.test_mAP50_95)} — the choice of objective barely matters
                </dd>
              </div>
            )}
          </dl>

          {overall && reference && (
            <p className="mt-6 text-sm text-slate-400">
              Highest overall: {overall.label} at {toPct(overall.test_mAP50_95)}, against a{" "}
              {toPct(reference.test_mAP50_95)} full-label reference ({reference.label}).
            </p>
          )}
        </section>
      )}

      {/* The reference file stamps its own qualifier, and every percentage
          above is a ratio against it -- so it belongs next to them. */}
      {reference?.caveat && (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-200/90">
          <span className="font-semibold">On the 100%-label reference. </span>
          {reference.caveat}. Every &ldquo;% of full-label performance&rdquo; figure on this page is
          a ratio against it, so those percentages are conservative.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Held-out test mAP50-95 by initialisation
        </h2>
        <SslCompareChart runs={data.runs} reference={reference} />

        {/* Explicit viva question -- the report states this, so the chart must
            not read as a clean like-for-like win. Text comes from the JSON. */}
        {data.runs
          .filter((r) => r.caveat)
          .map((r) => (
            <p
              key={r.init}
              className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-200/90"
            >
              <span className="font-semibold">Read {r.label} with care. </span>
              {r.caveat}
            </p>
          ))}

        {data.missing_inits.length > 0 && (
          <p className="text-xs text-slate-500">
            Not yet plotted: {data.missing_inits.join(", ")} — these runs had not written a result
            file when the metrics were last extracted.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Full results
        </h2>
        <SslResultsTable runs={data.runs} />
        <p className="text-xs text-slate-500">
          All figures are held-out test-split metrics read from the notebook JSONs.
          {data.protocol && (
            <>
              {" "}
              Shared protocol:{" "}
              {Object.entries(data.protocol)
                .map(([k, v]) => `${k} ${v}`)
                .join(", ")}
              .
            </>
          )}{" "}
          See{" "}
          <Link href="/methodology" className="text-blue-400 hover:text-blue-300">
            methodology
          </Link>
          .
        </p>
      </section>
    </>
  );
}
