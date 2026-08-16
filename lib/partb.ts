import fs from "node:fs";
import path from "node:path";
import type {
  SslComparison,
  LabelEfficiency,
  PartBPretraining,
  PartBTracking,
  ProtocolAudit,
  SslAblation,
  NotebookEvidence,
} from "./partb-types";

// Server-only reader for the output of extract_partb.py (repo root).
// Deliberately NOT wired through lib/api.ts: getAllModelMetrics() throws when
// a file is missing, which is right for Part A (all four models are done) and
// wrong for Part B, where SimCLR and most of the ablation grid may still be
// running at submission time. Everything here returns null instead, and every
// page has an "awaiting notebook output" branch.
//
// Types, colours and formatters live in ./partb-types so client components
// can use them without pulling node:fs into the browser bundle.

export * from "./partb-types";

function readOptional<T>(fileName: string): T | null {
  const filePath = path.join(process.cwd(), "data", "metrics", fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    // Missing OR malformed both mean "the notebook hasn't landed yet" as far
    // as the page is concerned -- there's nothing a viewer can do either way.
    return null;
  }
}

export function getSslComparison(): SslComparison | null {
  return readOptional<SslComparison>("partb_ssl_comparison.json");
}

export function getLabelEfficiency(): LabelEfficiency | null {
  return readOptional<LabelEfficiency>("partb_label_efficiency.json");
}

export function getPartBPretraining(): PartBPretraining | null {
  return readOptional<PartBPretraining>("partb_pretraining.json");
}

export function getPartBTracking(): PartBTracking | null {
  return readOptional<PartBTracking>("partb_tracking.json");
}

export function getProtocolAudit(): ProtocolAudit | null {
  return readOptional<ProtocolAudit>("partb_protocol_audit.json");
}

export function getSslAblation(): SslAblation | null {
  return readOptional<SslAblation>("partb_ssl_ablation.json");
}

export function getNotebookEvidence(): NotebookEvidence | null {
  return readOptional<NotebookEvidence>("partb_notebooks.json");
}
