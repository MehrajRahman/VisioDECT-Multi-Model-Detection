import Link from "next/link";
import type { Metadata } from "next";
import { getSslAblation, toPct, ABLATION_KEY_LABELS, AblationCell } from "@/lib/partb";
import { NOTEBOOKS } from "@/lib/kaggle-notebooks";
import AblationScatter from "@/components/AblationScatter";
import AwaitingOutput from "@/components/AwaitingOutput";

export const metadata: Metadata = {
  title: "Pretraining Ablation · VisioDECT",
  description:
    "Six self-supervised pretraining configurations sweeping learning rate, weight decay and EMA decay, measured by downstream detection at a fixed 20% label budget.",
};

function fmt(v: number | string | undefined): string {
  if (typeof v !== "number") return String(v ?? "—");
  return v < 0.001 ? v.toExponential(1) : String(v);
}

export default function SslAblationPage() {
  const data = getSslAblation();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Pretraining ablation
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Does the pretraining recipe matter?
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          The label-efficiency study varies how many annotations the detector sees. This one holds
          ρ fixed at 0.20 and varies how the backbone was pretrained instead — sweeping the
          self-supervised optimiser settings and measuring what reaches the detector.
        </p>
      </header>

      {data === null ? (
        <AwaitingOutput
          title="No pretraining ablation cells have been extracted yet"
          file="partb_ssl_ablation.json"
          detail="Each cell pairs a *_pretrain_summary.json with the downstream result from the same folder, under partb/ablation/."
        />
      ) : (
        <AblationContent data={data} />
      )}
    </main>
  );
}

function AblationContent({ data }: Readonly<{ data: NonNullable<ReturnType<typeof getSslAblation>> }>) {
  const scored = data.cells
    .filter((c) => typeof c.downstream?.test_mAP50_95 === "number")
    .sort((a, b) => (b.downstream!.test_mAP50_95 as number) - (a.downstream!.test_mAP50_95 as number));
  const best = scored[0];
  const worst = scored[scored.length - 1];

  return (
    <>
      {data.spread_pp !== null && best && worst && (
        <section className="rounded-3xl border border-blue-500/20 bg-blue-500/[0.06] p-6 sm:p-8">
          <p className="text-lg font-semibold leading-relaxed text-slate-100 sm:text-xl">
            Sweeping {data.varied_keys.length} pretraining hyperparameters across{" "}
            {data.cells.length} configurations moves downstream detection by{" "}
            <span className="text-blue-400">{data.spread_pp.toFixed(2)} pp</span>.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            Best is <span className="font-semibold">{best.cell}</span> at{" "}
            {toPct(best.downstream!.test_mAP50_95)}; worst is{" "}
            <span className="font-semibold">{worst.cell}</span> at{" "}
            {toPct(worst.downstream!.test_mAP50_95)}. Orders-of-magnitude changes in learning rate
            and weight decay produce under a percentage point of difference — the same insensitivity
            the four-way{" "}
            <Link href="/ssl" className="text-blue-400 hover:text-blue-300">
              objective comparison
            </Link>{" "}
            showed. What the backbone saw matters more than how it was optimised.
          </p>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-500">Swept</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-200">
                {data.varied_keys.map((k) => ABLATION_KEY_LABELS[k] ?? k).join(" · ")}
              </dd>
            </div>
            {Object.entries(data.held_config).length > 0 && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Held constant</dt>
                <dd className="mt-1 text-sm text-slate-400">
                  {Object.entries(data.held_config)
                    .map(([k, v]) => `${ABLATION_KEY_LABELS[k] ?? k} ${v}`)
                    .join(" · ")}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {/* Not comparable with the headline numbers -- different epoch budget. */}
      <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-200/90">
        <span className="font-semibold">Read these against each other, not against /ssl. </span>
        {data.note}
      </p>

      {data.varied_keys.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Downstream mAP against each swept parameter
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.varied_keys.map((key) => (
              <AblationScatter key={key} cells={data.cells} paramKey={key} />
            ))}
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
            All three parameters change together across the six cells, so no single panel isolates a
            causal effect — a flat cloud is the honest reading, and three flat clouds are the
            finding.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          All configurations
        </h2>
        <AblationTable cells={data.cells} variedKeys={data.varied_keys} />
        {data.cells[0]?.route && (
          <p className="max-w-3xl text-xs leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-400">Integration route: </span>
            {data.cells[0].route}
          </p>
        )}
      </section>
    </>
  );
}

// Each ablation cell was run in its own Kaggle notebook; link the row to it
// so a reader can go straight from a number to the code that produced it.
const CELL_NOTEBOOKS = new Map(
  NOTEBOOKS.filter((n) => n.cell && n.url).map((n) => [n.cell as string, n.url as string])
);

function AblationTable({
  cells,
  variedKeys,
}: Readonly<{ cells: AblationCell[]; variedKeys: string[] }>) {
  const sorted = [...cells].sort(
    (a, b) => (b.downstream?.test_mAP50_95 ?? -1) - (a.downstream?.test_mAP50_95 ?? -1)
  );
  const bestValue = sorted[0]?.downstream?.test_mAP50_95 ?? null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1122]">
      <table className="w-full min-w-[52rem] text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cell
            </th>
            {variedKeys.map((k) => (
              <th
                key={k}
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-blue-400"
              >
                {ABLATION_KEY_LABELS[k] ?? k}
              </th>
            ))}
            {["SSL loss", "Pretrain (min)", "mAP50", "mAP50-95"].map((h) => (
              <th
                key={h}
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const isBest = c.downstream?.test_mAP50_95 === bestValue;
            return (
              <tr key={c.cell} className="border-b border-white/5 last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-mono text-sm font-medium text-slate-100">
                  {CELL_NOTEBOOKS.has(c.cell) ? (
                    <a
                      href={CELL_NOTEBOOKS.get(c.cell)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {c.cell} ↗
                    </a>
                  ) : (
                    c.cell
                  )}
                  {isBest && <span className="ml-2 text-xs text-blue-400">★</span>}
                </th>
                {variedKeys.map((k) => (
                  <td key={k} className="px-4 py-3 text-right font-mono tabular-nums text-slate-300">
                    {fmt(c.config[k])}
                  </td>
                ))}
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                  {typeof c.best_loss === "number" ? c.best_loss.toFixed(4) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                  {typeof c.pretrain_minutes === "number" ? c.pretrain_minutes.toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                  {toPct(c.downstream?.test_mAP50)}
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums font-semibold ${
                    isBest ? "text-blue-400" : "text-slate-100"
                  }`}
                >
                  {toPct(c.downstream?.test_mAP50_95)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
        ★ highest downstream test mAP50-95. Every row is one self-supervised pretraining run
        followed by a fine-tune at ρ = 0.20.
      </p>
    </div>
  );
}
