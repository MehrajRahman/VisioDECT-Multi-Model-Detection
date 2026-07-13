"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { NormalizedSummary } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/normalize";

type ModelCompareChartProps = Readonly<{ data: NormalizedSummary[] }>;

export default function ModelCompareChart({ data }: ModelCompareChartProps) {
  const chartData = data.map((d) => ({
    name: MODEL_LABELS[d.model],
    mAP50: d.mAP50 !== null ? +(d.mAP50 * 100).toFixed(1) : null,
    "mAP50-95": d.mAP50_95 !== null ? +(d.mAP50_95 * 100).toFixed(1) : null,
    Precision: d.precision !== null ? +(d.precision * 100).toFixed(1) : null,
    Recall: d.recall !== null ? +(d.recall * 100).toFixed(1) : null,
    F1: d.f1 !== null ? +(d.f1 * 100).toFixed(1) : null,
  }));

  return (
    <div className="w-full h-[28rem] rounded-2xl border border-slate-200/70 bg-white/85 p-3 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe5f3" opacity={0.9} />
          <XAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12, fontWeight: 600 }} />
          <YAxis unit="%" domain={[0, 100]} tick={{ fill: "#475569", fontSize: 12 }} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #dbe5f3",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
              background: "#ffffff",
            }}
            formatter={(value) => (typeof value === "number" ? `${value}%` : String(value ?? ""))}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
          <Bar dataKey="mAP50" fill="#1d4ed8" radius={[5, 5, 0, 0]} />
          <Bar dataKey="mAP50-95" fill="#0f766e" radius={[5, 5, 0, 0]} />
          <Bar dataKey="Precision" fill="#0891b2" radius={[5, 5, 0, 0]} />
          <Bar dataKey="Recall" fill="#16a34a" radius={[5, 5, 0, 0]} />
          <Bar dataKey="F1" fill="#ea580c" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}