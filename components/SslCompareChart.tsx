"use client";

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { PartBRun, PartBReference, PARTB_COLORS } from "@/lib/partb-types";

type SslCompareChartProps = Readonly<{
  runs: PartBRun[];
  reference: PartBReference | null;
}>;

// One measure (held-out test mAP50-95) across six initialisations, so this is
// a single-series bar chart -- NOT the five-bar-per-model grouping used on the
// Part A comparison. Colour splits the SSL treatments from the two controls
// they're being argued against; it is not a per-model identity encoding.
export default function SslCompareChart({ runs, reference }: SslCompareChartProps) {
  const chartData = runs
    .filter((r) => typeof r.test_mAP50_95 === "number")
    .map((r) => ({
      name: r.label,
      value: +((r.test_mAP50_95 as number) * 100).toFixed(1),
      group: r.group,
      rho: r.rho,
    }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No downstream results carry a test mAP50-95 yet.
      </p>
    );
  }

  const refPct =
    typeof reference?.test_mAP50_95 === "number"
      ? +(reference.test_mAP50_95 * 100).toFixed(1)
      : null;

  // Headroom above the reference line so its label isn't clipped at the top.
  const maxPlotted = Math.max(...chartData.map((d) => d.value), refPct ?? 0);
  const yMax = Math.min(100, Math.ceil((maxPlotted + 12) / 10) * 10);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-4">
      {/* Legend lives outside the SVG so identity is readable even if the
          chart is screenshotted at small size for the report. */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PARTB_COLORS.ssl }} />
          Self-supervised pretraining
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: PARTB_COLORS.baseline }} />
          Baseline initialisation
        </span>
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
          <BarChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 8 }} barCategoryGap="22%">
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.08} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: "#cbd5e1", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "#ffffff", opacity: 0.15 }}
              interval={0}
            />
            <YAxis
              unit="%"
              domain={[0, yMax]}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={52}
            />
            <Tooltip
              cursor={{ fill: "rgba(148,163,184,0.10)" }}
              contentStyle={{
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#0d1122",
                color: "#e2e8f0",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#f1f5f9", fontWeight: 600 }}
              formatter={(value, _n, item) => {
                const rho = (item?.payload as { rho?: number | null })?.rho;
                const budget = typeof rho === "number" ? ` @ ρ=${rho.toFixed(2)}` : "";
                return [`${value}%${budget}`, "test mAP50-95"];
              }}
            />
            {refPct !== null && (
              <ReferenceLine
                y={refPct}
                stroke={PARTB_COLORS.reference}
                strokeDasharray="6 4"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            )}
            <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
              {chartData.map((d) => (
                <Cell
                  key={d.name}
                  fill={d.group === "ssl" ? PARTB_COLORS.ssl : PARTB_COLORS.baseline}
                />
              ))}
              {/* Direct labels: six bars is few enough that every value can be
                  read without hovering, which the report screenshots need. */}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(v) => (typeof v === "number" ? `${v}%` : "")}
                style={{ fill: "#e2e8f0", fontSize: 12, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
