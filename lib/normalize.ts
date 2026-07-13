import { ModelMetrics, ModelName, NormalizedSummary } from "./types";

// Your four notebooks produced summary JSON independently, so field names
// drifted: yolov10_results.json uses "test_mAP50" / "test_precision" / etc,
// while model_comparison/{rfdetr,yolov12,yolov26}.json use bare "mAP50" /
// "precision". This walks a list of candidate keys per metric so one function
// works across all of them -- add more candidates here if a new export
// format shows up rather than special-casing per model.
function pick(obj: Record<string, unknown> | undefined, candidates: string[]): number | null {
  if (!obj) return null;
  for (const key of candidates) {
    const v = obj[key];
    if (typeof v === "number") return v;
  }
  return null;
}

export function normalizeSummary(m: ModelMetrics): NormalizedSummary {
  const s = m.summary;
  return {
    model: m.model,
    mAP50: pick(s, ["mAP50", "test_mAP50"]),
    mAP50_95: pick(s, ["mAP50_95", "test_mAP50_95"]),
    precision: pick(s, ["precision", "test_precision"]),
    recall: pick(s, ["recall", "test_recall"]),
    f1: pick(s, ["f1", "test_F1", "test_f1"]),
    // fps field names vary the most -- yolov10 splits end-to-end vs batched,
    // rfdetr reports single-image. Prefer end-to-end / single-image since
    // that's the fairer "real deployment" number across architectures.
    fps: pick(s, ["fps_end_to_end", "fps_single_image", "fps"]),
  };
}

export const MODEL_LABELS: Record<ModelName, string> = {
  yolov10: "YOLOv10-m",
  yolov12: "YOLOv12-s",
  yolov26: "YOLOv26-s",
  rfdetr: "RF-DETR (nano)",
};

// Set true on the comparison page wherever RF-DETR sits alongside YOLO
// models -- its precision/recall come from a different matching method
// (greedy IoU@0.5) than Ultralytics' native val metrics, per its own
// model_comparison/rfdetr.json "pr_source" note. Don't drop this caveat.
export const RFDETR_METRIC_CAVEAT =
  "RF-DETR's precision/recall/F1 use greedy IoU-0.5 matching at conf 0.25, while YOLO models use Ultralytics' native validation metrics — treat cross-architecture comparisons of these specific fields as indicative, not exact.";