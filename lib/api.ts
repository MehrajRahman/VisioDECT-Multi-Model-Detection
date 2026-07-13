import fs from "node:fs";
import path from "node:path";
import { ModelMetrics, ModelName } from "./types";

const MODELS: ModelName[] = ["yolov10", "yolov12", "yolov26", "rfdetr"];

// Server-side only (used in Server Components / route handlers): reads the
// metrics JSON straight from disk. Put the metrics/*.json files (output of
// extract_metrics.py) at frontend/data/metrics/*.json.
export function getAllModelMetrics(): ModelMetrics[] {
  const dir = path.join(process.cwd(), "data", "metrics");
  return MODELS.map((m) => {
    const filePath = path.join(dir, `${m}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Missing ${filePath} -- run extract_metrics.py and copy_images.py, then place the JSONs in frontend/data/metrics/`
      );
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as ModelMetrics;
  });
}

export function getModelMetrics(model: ModelName): ModelMetrics {
  const found = getAllModelMetrics().find((m) => m.model === model);
  if (!found) throw new Error(`Unknown model ${model}`);
  return found;
}