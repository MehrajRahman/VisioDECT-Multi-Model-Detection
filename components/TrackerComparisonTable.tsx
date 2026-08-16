import { TrackerRun, TrackingMetric } from "@/lib/partb-types";

// Server component -- no interactivity needed, three columns fit without
// sorting, and keeping it off the client bundle means the videos get the
// bandwidth instead.

function formatValue(metric: TrackingMetric): string {
  const rounded = Number.isInteger(metric.value)
    ? metric.value.toString()
    : metric.value.toFixed(metric.value < 10 ? 3 : 1);
  return metric.unit ? `${rounded} ${metric.unit}` : rounded;
}

/** Which trackers tie for best on this row, so ties aren't shown as a win. */
function bestTrackers(runs: TrackerRun[], metric: TrackingMetric): Set<string> {
  const values = runs
    .map((r) => ({ tracker: r.tracker, m: r.metrics.find((x) => x.key === metric.key) }))
    .filter((x): x is { tracker: string; m: TrackingMetric } => x.m !== undefined);
  if (values.length < 2) return new Set();
  const target = metric.lower_is_better
    ? Math.min(...values.map((v) => v.m.value))
    : Math.max(...values.map((v) => v.m.value));
  const winners = values.filter((v) => v.m.value === target);
  return winners.length === values.length ? new Set() : new Set(winners.map((v) => v.tracker));
}

export default function TrackerComparisonTable({
  runs,
  expectedObjects,
}: Readonly<{ runs: TrackerRun[]; expectedObjects: number | null }>) {
  // Row order follows the first run's metric list, which the extractor emits
  // in a fixed, meaningful order (identity quality first, cost last).
  const rows = runs[0]?.metrics ?? [];
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1122]">
      <table className="w-full min-w-[44rem] text-sm">
        <caption className="sr-only">Tracker comparison metrics</caption>
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              Metric
            </th>
            {runs.map((run) => (
              <th
                key={run.tracker}
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-200"
              >
                {run.tracker}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const winners = bestTrackers(runs, row);
            const isIdCount = row.key === "unique_track_ids";
            return (
              <tr key={row.key} className="border-b border-white/5 last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-normal">
                  <span className="font-medium text-slate-200">{row.label}</span>
                  {isIdCount && typeof expectedObjects === "number" && (
                    <span className="ml-2 text-xs text-slate-500">(expected {expectedObjects})</span>
                  )}
                  {row.note && <span className="mt-0.5 block text-xs text-slate-500">{row.note}</span>}
                </th>
                {runs.map((run) => {
                  const metric = run.metrics.find((m) => m.key === row.key);
                  const won = winners.has(run.tracker);
                  return (
                    <td
                      key={run.tracker}
                      className={`px-4 py-3 text-right tabular-nums ${
                        won ? "font-semibold text-blue-400" : "text-slate-300"
                      }`}
                    >
                      {metric ? formatValue(metric) : "—"}
                      {/* Bold alone would encode "best" in styling only; the
                          marker keeps it readable without colour. */}
                      {won && <span className="ml-1 text-xs text-blue-400/70">★</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
        ★ marks the best value in each row. Ties are not marked.
      </p>
    </div>
  );
}
