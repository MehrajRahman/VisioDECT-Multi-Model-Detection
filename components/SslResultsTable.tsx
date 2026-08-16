"use client";

import { useState } from "react";
import { PartBRun, PARTB_COLORS, toPct } from "@/lib/partb-types";

type SortKey =
  | "label"
  | "test_precision"
  | "test_recall"
  | "test_mAP50"
  | "test_mAP50_95"
  | "best_epoch"
  | "train_minutes";

const COLUMNS: Array<{ key: SortKey; header: string; numeric: boolean; pct: boolean }> = [
  { key: "label", header: "Initialisation", numeric: false, pct: false },
  { key: "test_precision", header: "Precision", numeric: true, pct: true },
  { key: "test_recall", header: "Recall", numeric: true, pct: true },
  { key: "test_mAP50", header: "mAP50", numeric: true, pct: true },
  { key: "test_mAP50_95", header: "mAP50-95", numeric: true, pct: true },
  { key: "best_epoch", header: "Best epoch", numeric: true, pct: false },
  { key: "train_minutes", header: "Train (min)", numeric: true, pct: false },
];

export default function SslResultsTable({ runs }: Readonly<{ runs: PartBRun[] }>) {
  const [sortKey, setSortKey] = useState<SortKey>("test_mAP50_95");
  const [asc, setAsc] = useState(false);

  const sorted = [...runs].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    // Rows with no value for the sorted column always sink to the bottom,
    // in both directions -- an absent metric isn't "the smallest".
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const cmp = typeof av === "number" && typeof bv === "number"
      ? av - bv
      : String(av).localeCompare(String(bv));
    return asc ? cmp : -cmp;
  });

  function toggle(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(key === "label");
    }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0d1122]">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                scope="col"
                // aria-sort belongs on the header cell, not the button inside it.
                aria-sort={sortKey === col.key ? (asc ? "ascending" : "descending") : "none"}
                className={col.numeric ? "text-right" : "text-left"}
              >
                <button
                  type="button"
                  onClick={() => toggle(col.key)}
                  className={`w-full px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-white ${
                    col.numeric ? "text-right" : "text-left"
                  } ${sortKey === col.key ? "text-blue-400" : "text-slate-400"}`}
                >
                  {col.header}
                  {sortKey === col.key ? (asc ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((run) => (
            <tr key={run.init} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">
                <span className="flex items-center gap-2 font-medium text-slate-100">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{
                      background: run.group === "ssl" ? PARTB_COLORS.ssl : PARTB_COLORS.baseline,
                    }}
                  />
                  {run.label}
                </span>
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">{toPct(run.test_precision)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">{toPct(run.test_recall)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">{toPct(run.test_mAP50)}</td>
              <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-100">
                {toPct(run.test_mAP50_95)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                {run.best_epoch ?? "—"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                {typeof run.train_minutes === "number" ? run.train_minutes.toFixed(1) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
