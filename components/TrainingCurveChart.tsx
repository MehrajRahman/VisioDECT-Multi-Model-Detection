"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ModelMetrics } from "@/lib/types";
import { resolveModelImage } from "@/lib/image-assets";

type TrainingCurveChartProps = Readonly<{ metrics: ModelMetrics }>;

// Columns that are numeric but shouldn't be charted at all: monotonically
// increasing cumulative counters that would dwarf everything else on any
// shared axis, not actual training signal.
const EXCLUDE_KEYS = new Set(["epoch", "time"]);

// Ultralytics results.csv mixes columns on wildly different scales --
// losses run ~0-5, precision/recall/mAP run 0-1, learning rate runs ~1e-5.
// Plotting all of them on one axis makes everything but the largest-scale
// line look flat at zero. Split into two groups by column name pattern
// instead, so each chart's lines are actually comparable to each other.
function splitMetricKeys(keys: string[]): { lossKeys: string[]; perfKeys: string[]; otherKeys: string[] } {
  const lossKeys = keys.filter((k) => /loss/i.test(k) || /^lr\//i.test(k));
  const perfKeys = keys.filter((k) => /precision|recall|mAP/i.test(k));
  const otherKeys = keys.filter((k) => !lossKeys.includes(k) && !perfKeys.includes(k));
  return { lossKeys, perfKeys, otherKeys };
}

function getNumericKeys(metrics: ModelMetrics): string[] {
  const first = metrics.training_curve?.[0];
  if (!first) return [];
  return Object.keys(first).filter((k) => !EXCLUDE_KEYS.has(k) && typeof first[k] === "number");
}

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#84cc16"];

function MiniLineChart({
  data,
  keys,
  title,
}: {
  data: Record<string, unknown>[];
  keys: string[];
  title: string;
}) {
  if (keys.length === 0) return null;
  return (
    <div className="w-full h-72">
      <h3 className="text-sm font-medium opacity-70 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="epoch" />
          <YAxis />
          <Tooltip />
          <Legend />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TrainingCurveChart({ metrics }: TrainingCurveChartProps) {
  if (!metrics.training_curve || metrics.training_curve.length === 0) {
    const curveSrc = resolveModelImage(metrics.model, metrics.training_curve_image, "training_curve");
    if (!curveSrc) {
      return <p className="text-sm opacity-60">No training curve available for this model.</p>;
    }
    return <img src={curveSrc} alt="Training curve" className="w-full rounded-lg border border-white/10" />;
  }

  const allKeys = getNumericKeys(metrics);
  const { lossKeys, perfKeys, otherKeys } = splitMetricKeys(allKeys);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <MiniLineChart data={metrics.training_curve} keys={perfKeys} title="Precision / Recall / mAP" />
      <MiniLineChart data={metrics.training_curve} keys={lossKeys} title="Loss & Learning Rate" />
      {otherKeys.length > 0 && (
        <div className="md:col-span-2">
          <MiniLineChart data={metrics.training_curve} keys={otherKeys} title="Other" />
        </div>
      )}
    </div>
  );
}