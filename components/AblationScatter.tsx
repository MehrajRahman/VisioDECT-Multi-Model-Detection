"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AblationCell, ABLATION_KEY_LABELS, PARTB_COLORS } from "@/lib/partb-types";

// One small multiple per swept hyperparameter: downstream mAP against that
// knob alone. With six cells and three knobs varying together this cannot
// isolate a causal effect -- which is the point. A flat cloud is the honest
// reading, and three flat clouds say the recipe barely matters.
export default function AblationScatter({
  cells,
  paramKey,
}: Readonly<{ cells: AblationCell[]; paramKey: string }>) {
  const points = cells
    .filter((c) => typeof c.downstream?.test_mAP50_95 === "number")
    .map((c) => ({
      x: Number(c.config[paramKey]),
      y: +((c.downstream!.test_mAP50_95 as number) * 100).toFixed(2),
      cell: c.cell,
    }))
    .filter((p) => Number.isFinite(p.x))
    .sort((a, b) => a.x - b.x);

  if (points.length < 2) return null;

  const ys = points.map((p) => p.y);
  const pad = Math.max(0.15, (Math.max(...ys) - Math.min(...ys)) * 0.25);
  const label = ABLATION_KEY_LABELS[paramKey] ?? paramKey;

  // Log scale where the sweep spans more than a decade (lr, weight_decay);
  // linear otherwise (EMA sits in a narrow band near 1).
  const xs = points.map((p) => p.x);
  const useLog = Math.min(...xs) > 0 && Math.max(...xs) / Math.min(...xs) >= 10;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-4">
      <h3 className="mb-1 text-sm font-semibold text-slate-200">{label}</h3>
      <p className="mb-3 text-xs text-slate-500">
        {useLog ? "log scale · " : ""}
        {points.length} cells
      </p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.08} />
            <XAxis
              type="number"
              dataKey="x"
              scale={useLog ? "log" : "linear"}
              domain={useLog ? ["dataMin", "dataMax"] : ["auto", "auto"]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#ffffff", opacity: 0.15 }}
              tickFormatter={(v: number) => (v < 0.01 ? v.toExponential(0) : String(v))}
            />
            <YAxis
              type="number"
              dataKey="y"
              unit="%"
              domain={[
                +(Math.min(...ys) - pad).toFixed(2),
                +(Math.max(...ys) + pad).toFixed(2),
              ]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <ZAxis range={[90, 90]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(148,163,184,0.35)" }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#0d1122",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              formatter={(value, name) =>
                name === "y" ? [`${value}% mAP50-95`, "downstream"] : [String(value), label]
              }
              labelFormatter={() => ""}
            />
            <Scatter data={points} fill={PARTB_COLORS.ssl} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
