// Client-safe half of the Part B data layer: types, colours, and pure
// formatters. Kept separate from lib/partb.ts because that file imports
// node:fs, and the charts and the sortable table are client components --
// importing the reader from them drags fs into the browser bundle and fails
// the build. Client components import from here; server pages may use either.

export type SslInit = "simclr" | "byol" | "ijepa" | "dinov3" | "random" | "coco";

export interface PartBRun {
  init: SslInit;
  label: string;
  group: "ssl" | "baseline";
  rho: number | null;
  epochs: number | null;
  train_minutes: number | null;
  best_epoch: number | null;
  train_images: number | null;
  checkpoint?: string;
  source_file: string;
  caveat?: string;

  val_precision: number | null;
  val_recall: number | null;
  val_mAP50: number | null;
  val_mAP50_95: number | null;
  test_precision: number | null;
  test_recall: number | null;
  test_mAP50: number | null;
  test_mAP50_95: number | null;
}

export interface PartBReference {
  label: string;
  test_mAP50_95: number | null;
  test_mAP50?: number | null;
  test_precision?: number | null;
  test_recall?: number | null;
  // The notebook stamps its own qualifier on the reference file. It governs
  // every "% of full-label performance" claim, so it is rendered wherever
  // that percentage is.
  caveat?: string | null;
  source_file: string;
}

// Read out of the run manifests rather than declared here -- the exact key
// set depends on what the notebooks recorded, and only fields every manifest
// agreed on survive extraction.
export type FrozenProtocol = Record<string, string | number>;

export interface SslComparison {
  reference: PartBReference | null;
  runs: PartBRun[];
  missing_inits: SslInit[];
  protocol: FrozenProtocol | null;
}

export interface LabelEfficiencySeries {
  init: SslInit;
  label: string;
  caveat?: string | null;
  points: PartBRun[];
}

export interface LabelEfficiency {
  reference: PartBReference | null;
  series: LabelEfficiencySeries[];
  grid: { expected_cells: number; present_cells: number; missing_cells: string[] };
}

export interface PretrainMethod {
  method: SslInit;
  label: string;
  caveat?: string | null;
  epochs: number | null;
  image_size: number | null;
  seed: number | null;
  ssl_pool_images: number | null;
  best_loss: number | null;
  train_minutes: number | null;
  partition_fingerprint?: string;
  source_file: string;
  diagnostics?: {
    retrieval_top1: number | null;
    cross_scenario_top1: number | null;
    [k: string]: unknown;
  };
  figures?: Partial<Record<"loss_curve" | "tsne" | "retrieval" | "views", string>>;
}

export interface PartBPretraining {
  partition: {
    fingerprint?: string | null;
    fingerprint_consistent?: boolean;
    seed?: number;
    val_images?: number;
    test_images?: number;
    pool_images?: number;
    ssl_pool_images?: number;
  } | null;
  methods: PretrainMethod[];
  protocol: FrozenProtocol | null;
}

export interface TrackingMetric {
  key: string;
  label: string;
  unit: string;
  lower_is_better: boolean;
  note: string | null;
  value: number;
}

export interface TrackerRun {
  tracker: string;
  video: string | null;
  metrics: TrackingMetric[];
}

export interface PartBTracking {
  detector: string | null;
  video: string | null;
  video_props: string | null;
  expected_objects: number | null;
  track_conf: number | null;
  imgsz: number | null;
  detection_only_video: string | null;
  runs: TrackerRun[];
  figures: string[];
  source_file: string;
}

export interface SslSummary {
  scored: PartBRun[];
  byScore: PartBRun[];
  bestSsl: PartBRun | null;
  worstSsl: PartBRun | null;
  random: PartBRun | null;
  coco: PartBRun | null;
  overall: PartBRun | null;
  /** Best SSL run as a share of the 100%-label reference. */
  bestSslRecovery: number | null;
  /** Percentage-point gaps. Null when either side is missing. */
  sslOverRandomPp: number | null;
  cocoOverSslPp: number | null;
  sslSpreadPp: number | null;
}

function gapPp(a: PartBRun | null, b: PartBRun | null): number | null {
  if (!a || !b || typeof a.test_mAP50_95 !== "number" || typeof b.test_mAP50_95 !== "number") {
    return null;
  }
  return (a.test_mAP50_95 - b.test_mAP50_95) * 100;
}

/**
 * Every headline claim about the SSL comparison, derived in one place.
 *
 * Both /ssl and the Part B overview render these numbers; computing them
 * twice invites the two pages to disagree after a data refresh. Nothing here
 * assumes a winner -- the brief predicted DINOv3 would top Task 1 and the
 * finished runs put COCO ahead of all four SSL methods, so any hardcoded
 * ranking would already be wrong.
 */
export function summarizeSsl(data: SslComparison | null): SslSummary {
  const scored = (data?.runs ?? []).filter((r) => typeof r.test_mAP50_95 === "number");
  const byScore = [...scored].sort((a, b) => (b.test_mAP50_95 ?? 0) - (a.test_mAP50_95 ?? 0));

  const bestSsl = byScore.find((r) => r.group === "ssl") ?? null;
  // Reverse the SCORE-sorted list, not the extraction-ordered one, whose last
  // SSL entry is merely whichever method the extractor emitted last.
  const worstSsl = [...byScore].reverse().find((r) => r.group === "ssl") ?? null;
  const random = scored.find((r) => r.init === "random") ?? null;
  const coco = scored.find((r) => r.init === "coco") ?? null;

  return {
    scored,
    byScore,
    bestSsl,
    worstSsl,
    random,
    coco,
    overall: byScore[0] ?? null,
    bestSslRecovery: recoveryRatio(
      bestSsl?.test_mAP50_95 ?? null,
      data?.reference?.test_mAP50_95 ?? null
    ),
    sslOverRandomPp: gapPp(bestSsl, random),
    cocoOverSslPp: gapPp(coco, bestSsl),
    sslSpreadPp: bestSsl && worstSsl && bestSsl.init !== worstSsl.init ? gapPp(bestSsl, worstSsl) : null,
  };
}

export interface ClosestApproach {
  point: PartBRun;
  /** Percentage points still short of the threshold. Always > 0. */
  shortfallPp: number;
  /** Fraction of the threshold actually attained, e.g. 0.999. */
  attained: number;
}

/**
 * The best measured point when a threshold is never cleared.
 *
 * A bare "not reached" throws away the informative part of a negative
 * result: at rho = 0.50 the curve lands 0.05 pp under the 95%-of-reference
 * bar, which is a materially different statement from missing it by five
 * points. The bonus task is graded on break-even analysis, so the near-miss
 * is worth reporting precisely.
 */
export function closestApproach(
  points: PartBRun[],
  threshold: number | null
): ClosestApproach | null {
  if (typeof threshold !== "number") return null;
  const best = points
    .filter((p) => typeof p.test_mAP50_95 === "number")
    .sort((a, b) => (b.test_mAP50_95 ?? 0) - (a.test_mAP50_95 ?? 0))[0];
  if (!best || typeof best.test_mAP50_95 !== "number" || best.test_mAP50_95 >= threshold) {
    return null;
  }
  return {
    point: best,
    shortfallPp: (threshold - best.test_mAP50_95) * 100,
    attained: best.test_mAP50_95 / threshold,
  };
}

export interface EfficiencyStep {
  from: number;
  to: number;
  /** Percentage-point change in test mAP50-95 across this step. */
  gain: number;
}

/** Per-step gains along one initialisation's label-efficiency curve. */
export function efficiencySteps(series: LabelEfficiencySeries | undefined): EfficiencyStep[] {
  const points = (series?.points ?? []).filter((p) => typeof p.test_mAP50_95 === "number");
  return points.slice(1).map((p, i) => ({
    from: points[i].rho as number,
    to: p.rho as number,
    gain: ((p.test_mAP50_95 as number) - (points[i].test_mAP50_95 as number)) * 100,
  }));
}

/**
 * The point where the curve flattens: the first step (after the first) whose
 * gain falls below a third of the opening step's. This is the quantity an
 * annotation-budget decision actually turns on -- not any single mAP value.
 * Null when there are too few measured points to see a knee.
 */
export function efficiencyKnee(steps: EfficiencyStep[]): EfficiencyStep | null {
  if (steps.length < 2) return null;
  return steps.find((s, i) => i > 0 && s.gain < steps[0].gain / 3) ?? null;
}

export interface NotebookEvidence {
  /** Notebook names stamped by the runs onto their own JSON outputs. */
  declared: Array<{ notebook: string; artefacts: number }>;
  /** owner/slug pairs recovered from /kaggle/input/notebooks/... paths -- real URLs. */
  resolved: Array<{ slug: string; owner: string; url: string }>;
}

export interface AblationCell {
  cell: string;
  method: string;
  route: string | null;
  student: string | null;
  config: Record<string, number | string>;
  pretrain_minutes: number | null;
  best_loss: number | null;
  ssl_pool_images: number | null;
  source_file: string;
  downstream?: {
    rho: number | null;
    epochs: number | null;
    train_minutes: number | null;
    best_epoch: number | null;
    test_precision: number | null;
    test_recall: number | null;
    test_mAP50: number | null;
    test_mAP50_95: number | null;
    val_mAP50_95: number | null;
  };
}

export interface SslAblation {
  cells: AblationCell[];
  /** Which pretraining knobs actually differ across the sweep. */
  varied_keys: string[];
  held_config: Record<string, number | string>;
  spread_pp: number | null;
  note: string;
}

/** Human labels for the swept pretraining knobs. */
export const ABLATION_KEY_LABELS: Record<string, string> = {
  lr: "Learning rate",
  weight_decay: "Weight decay",
  ema: "EMA decay",
  epochs: "Epochs",
  image_size: "Image size",
  batch_size: "Batch size",
  temperature: "Temperature",
  momentum: "Momentum",
};

export interface AuditRun {
  name: string;
  init: string;
  rho: number | null;
}

export interface AuditVarying {
  key: string;
  values: Record<string, string>;
  /** True when the assignment permits this field to differ between runs. */
  expected: boolean;
  reason: string | null;
}

export interface AuditGroup {
  /** The assignment's own wording for this class of hyperparameter. */
  label: string;
  keys: Array<{ key: string; value: string; held: boolean }>;
  held: boolean;
  drifted: string[];
}

export interface ProtocolAudit {
  runs: AuditRun[];
  total_keys: number;
  constant_count: number;
  varying: AuditVarying[];
  groups: AuditGroup[];
  unexpected_drift: string[];
  compliant: boolean;
}

export function trackingAssetSrc(fileName: string | null | undefined): string | null {
  return fileName ? `/partb-tracking/${fileName}` : null;
}

export function findMetric(run: TrackerRun, key: string): TrackingMetric | undefined {
  return run.metrics.find((m) => m.key === key);
}

// Dark-surface steps validated against the #0d1122 card background
// (adjacent CVD ΔE 26.8, normal-vision ΔE 31.8, both >= 3:1 contrast).
// Keyed by ENTITY, not by rank -- DINOv3 stays blue whether it sorts first or
// last, and stays blue across both Part B pages.
export const PARTB_COLORS = {
  ssl: "#3987e5",
  baseline: "#d95926",
  reference: "#94a3b8",
} as const;

export function partbFigureSrc(fileName: string | undefined): string | null {
  return fileName ? `/model-images/partb/${fileName}` : null;
}

export function toPct(value: number | null | undefined, digits = 1): string {
  return typeof value === "number" ? `${(value * 100).toFixed(digits)}%` : "—";
}

/** Share of the full-label reference this run recovered, e.g. 0.6083/0.6678. */
export function recoveryRatio(run: number | null, reference: number | null): number | null {
  if (typeof run !== "number" || typeof reference !== "number" || reference === 0) return null;
  return run / reference;
}

/**
 * Smallest label fraction where a series meets or exceeds `threshold`.
 * Returns null when no measured cell clears it -- the honest answer when the
 * grid is incomplete, rather than extrapolating a break-even we never ran.
 */
export function breakEvenRho(points: PartBRun[], threshold: number | null): number | null {
  if (typeof threshold !== "number") return null;
  const cleared = points
    .filter((p) => typeof p.test_mAP50_95 === "number" && p.test_mAP50_95 >= threshold)
    .filter((p) => typeof p.rho === "number")
    .sort((a, b) => (a.rho ?? 0) - (b.rho ?? 0));
  return cleared.length > 0 ? (cleared[0].rho as number) : null;
}
