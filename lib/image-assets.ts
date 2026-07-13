import { ModelName } from "./types";

export type ArtifactKind =
  | "training_curve"
  | "confusion_matrix"
  | "confusion_matrix_test"
  | "failure_breakdown"
  | "eigencam";

// The exact set of files copy_images.py actually produced (see scripts/).
// Used as a safety net: if a metrics JSON's filename field doesn't match
// what's really in public/model-images/ (e.g. after a re-run with different
// naming), fall back to the canonical {model}_{kind}_image.png pattern
// instead of silently rendering a broken image.
const AVAILABLE_IMAGES = new Set([
  "rfdetr_failure_breakdown_image.png",
  "rfdetr_training_curve_image.png",
  "yolov10_confusion_matrix_image.png",
  "yolov12_confusion_matrix_image.png",
  "yolov12_confusion_matrix_test_image.png",
  "yolov12_eigencam_image.png",
  "yolov12_failure_breakdown_image.png",
  "yolov26_confusion_matrix_image.png",
  "yolov26_confusion_matrix_test_image.png",
  "yolov26_eigencam_image.png",
  "yolov26_failure_breakdown_image.png",
]);

function getCanonicalName(model: ModelName, kind: ArtifactKind): string | null {
  if (kind === "training_curve") {
    if (model === "rfdetr") return "rfdetr_training_curve_image.png";
    return null; // yolov10/12/26 have real CSV training curves, no fallback image
  }
  if (kind === "confusion_matrix") return `${model}_confusion_matrix_image.png`;
  if (kind === "confusion_matrix_test") return `${model}_confusion_matrix_test_image.png`;
  if (kind === "failure_breakdown") return `${model}_failure_breakdown_image.png`;
  if (kind === "eigencam") return `${model}_eigencam_image.png`;
  return null;
}

export function resolveModelImage(
  model: ModelName,
  rawName: string | undefined,
  kind: ArtifactKind
): string | null {
  if (rawName && AVAILABLE_IMAGES.has(rawName)) return `/model-images/${rawName}`;

  const canonical = getCanonicalName(model, kind);
  if (canonical && AVAILABLE_IMAGES.has(canonical)) return `/model-images/${canonical}`;

  return null;
}