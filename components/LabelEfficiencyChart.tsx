"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { LabelEfficiencySeries, PartBReference, PARTB_COLORS } from "@/lib/partb-types";

type LabelEfficiencyChartProps = Readonly<{
  series: LabelEfficiencySeries[];
  reference: PartBReference | null;
}>;

const SERIES_COLOR: Record<string, string> = {
  dinov3: PARTB_COLORS.ssl,
  coco: PARTB_COLORS.baseline,
};

// Recharts joins a series across nulls only with connectNulls; we instead
// build one row per label fraction and leave absent cells undefined, so a
// missing grid cell shows as a genuine gap rather than a straight line
// implying a measurement we never ran.
function toRows(series: LabelEfficiencySeries[]) {
  const rhos = new Set<number>();
  for (const s of series) {
    for (const p of s.points) if (typeof p.rho === "number") rhos.add(p.rho);
  }
  return [...rhos]
    .sort((a, b) => a - b)
    .map((rho) => {
      const row: Record<string, number | null> = { rho: +(rho * 100).toFixed(0) };
      for (const s of series) {
        const point = s.points.find((p) => p.rho === rho);
        row[s.init] =
          typeof point?.test_mAP50_95 === "number"
            ? +(point.test_mAP50_95 * 100).toFixed(1)
            : null;
      }
      return row;
    });
}

export default function LabelEfficiencyChart({ series, reference }: LabelEfficiencyChartProps) {
  const rows = toRows(series);
  const plotted = series.filter((s) => s.points.some((p) => typeof p.test_mAP50_95 === "number"));

  if (rows.length === 0 || plotted.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No ablation cells have landed yet — the curve will draw as soon as the bonus
        notebook writes its first result.
      </p>
    );
  }

  const refPct =
    typeof reference?.test_mAP50_95 === "number"
      ? +(reference.test_mAP50_95 * 100).toFixed(1)
      : null;

  const values = rows.flatMap((r) =>
    plotted.map((s) => r[s.init]).filter((v): v is number => typeof v === "number")
  );
  const yMin = Math.max(0, Math.floor((Math.min(...values) - 8) / 5) * 5);
  const yMax = Math.min(100, Math.ceil((Math.max(...values, refPct ?? 0) + 6) / 5) * 5);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-4">
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
        {plotted.map((s) => (
          <span key={s.init} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: SERIES_COLOR[s.init] ?? PARTB_COLORS.ssl }}
            />
            {s.label}
          </span>
        ))}
        {refPct !== null && (
          <span className="flex items-center gap-2">
            <span
              className="h-0 w-5 border-t-2 border-dashed"
              style={{ borderColor: PARTB_COLORS.reference }}
            />
            100% labels ({refPct}%)
          </span>
        )}
      </div>

      <div className="h-[26rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 16, right: 24, left: 0, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.08} />
            <XAxis
              dataKey="rho"
              unit="%"
              type="number"
              domain={["dataMin", "dataMax"]}
              ticks={rows.map((r) => r.rho as number)}
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#ffffff", opacity: 0.15 }}
              label={{
                value: "Bounding-box label budget (ρ)",
                position: "insideBottom",
                offset: -8,
                fill: "#94a3b8",
                fontSize: 12,
              }}
            />
            <YAxis
              unit="%"
              domain={[yMin, yMax]}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              cursor={{ stroke: "rgba(148,163,184,0.35)", strokeWidth: 1 }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#0d1122",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
              labelFormatter={(rho) => `ρ = ${Number(rho) / 100}`}
              formatter={(value, name) => [
                `${value}%`,
                plotted.find((s) => s.init === name)?.label ?? String(name),
              ]}
            />
            {refPct !== null && (
              <ReferenceLine
                y={refPct}
                stroke={PARTB_COLORS.reference}
                strokeDasharray="6 4"
                strokeWidth={2}
              />
            )}
            {plotted.map((s) => (
              <Line
                key={s.init}
                type="monotone"
                dataKey={s.init}
                stroke={SERIES_COLOR[s.init] ?? PARTB_COLORS.ssl}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
