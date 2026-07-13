// // Mirrors the output of scripts/extract_metrics.py.
// // NOTE: `summary` shape genuinely differs per model -- your notebooks produced
// // them independently, so field names aren't consistent (yolov10 uses
// // "test_mAP50", rfdetr/yolov12/yolov26 use "mAP50"). Don't assume uniform
// // keys here; use normalizeSummary() in lib/normalize.ts to get a consistent
// // shape for cross-model comparison charts.

// export type ModelName = "yolov10" | "yolov12" | "yolov26" | "rfdetr";

// export interface TrainingCurveRow {
//   epoch: number;
//   [metricKey: string]: number; // Ultralytics results.csv columns vary by version
// }

// export interface PerClassRow {
//   class: string;
//   [metric: string]: string | number;
// }

// export interface ModelMetrics {
//   model: ModelName;

//   // raw, as produced by each notebook -- see lib/normalize.ts before charting
//   summary?: Record<string, unknown>;

//   training_curve?: TrainingCurveRow[];
//   training_curve_image?: string; // filename under /model-images, when no CSV exists (rfdetr)
//   training_curve_source?: "csv" | "image";

//   confusion_matrix_image?: string; // train/val split
//   confusion_matrix_test_image?: string; // held-out test split (yolov12/26 only)

//   per_class?: PerClassRow[];
//   test_metrics?: Record<string, unknown>[];
//   confidence_sweep?: Record<string, unknown>[];
//   error_analysis?: Record<string, unknown>[];

//   failure_breakdown_image?: string;
//   eigencam_image?: string; // yolo-only
// }

// export interface NormalizedSummary {
//   model: ModelName;
//   mAP50: number | null;
//   mAP50_95: number | null;
//   precision: number | null;
//   recall: number | null;
//   f1: number | null;
//   fps: number | null;
// }


// Mirrors the output of scripts/extract_metrics.py.
// NOTE: `summary` shape genuinely differs per model -- your notebooks produced
// them independently, so field names aren't consistent (yolov10 uses
// "test_mAP50", rfdetr/yolov12/yolov26 use "mAP50"). Don't assume uniform
// keys here; use normalizeSummary() in lib/normalize.ts to get a consistent
// shape for cross-model comparison charts.

export type ModelName = "yolov10" | "yolov12" | "yolov26" | "rfdetr";

export interface TrainingCurveRow {
  epoch: number;
  [metricKey: string]: number; // Ultralytics results.csv columns vary by version
}

export interface PerClassRow {
  class: string;
  [metric: string]: string | number;
}

// Shared shape for a single detected box, used by both the live image and
// live video inference views (lib/live-api.ts) so box-drawing code
// (lib/detection-draw.ts) only has to be written once.
export interface Detection {
  class: string;
  confidence: number;
  box: [number, number, number, number]; // [x1, y1, x2, y2] in source-image pixel coords
}

export interface ModelMetrics {
  model: ModelName;

  // raw, as produced by each notebook -- see lib/normalize.ts before charting
  summary?: Record<string, unknown>;

  training_curve?: TrainingCurveRow[];
  training_curve_image?: string; // filename under /model-images, when no CSV exists (rfdetr)
  training_curve_source?: "csv" | "image";

  confusion_matrix_image?: string; // train/val split
  confusion_matrix_test_image?: string; // held-out test split (yolov12/26 only)

  per_class?: PerClassRow[];
  test_metrics?: Record<string, unknown>[];
  confidence_sweep?: Record<string, unknown>[];
  error_analysis?: Record<string, unknown>[];

  failure_breakdown_image?: string;
  eigencam_image?: string; // yolo-only
}

export interface NormalizedSummary {
  model: ModelName;
  mAP50: number | null;
  mAP50_95: number | null;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  fps: number | null;
}