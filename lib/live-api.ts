import { Client } from "@gradio/client";
import { Detection, ModelName } from "./types";

// Runtime subdomain that actually serves the app -- NOT the huggingface.co
// "/spaces/..." page URL (that's the human-browsable page, not a valid
// Client.connect target).
// Use the Hugging Face namespace, NOT the direct .hf.space URL.
const DEFAULT_BACKEND_URL = "rahmanmehraj627/visiodect-api";
function getSpaceUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_BACKEND_URL;
}

// Anonymous/unauthenticated requests to a ZeroGPU Space share a tiny public
// quota pool that's essentially always exhausted -- that's the
// "ZeroGPU quota exceeded (0s left)" error. Authenticating with ANY valid HF
// token (read-only is enough, doesn't need write access) gets you a real
// per-user quota instead. Set NEXT_PUBLIC_HF_TOKEN in .env.local and in
// Vercel's project env vars.
//
// SECURITY NOTE: NEXT_PUBLIC_ vars are bundled into the client-side JS and
// visible to anyone who opens devtools/view-source on your deployed site --
// this token WILL be exposed. Use a token scoped to read-only access so the
// worst case is someone borrowing your ZeroGPU quota, not anything more
// sensitive. For a class project this is a reasonable tradeoff; a fully
// secure setup would proxy these calls through a Next.js API route that
// holds the token server-side instead.
// Extract the exact options type Client.connect actually expects, so we can
// cast through it instead of `any` -- the installed @gradio/client version's
// TS types don't declare hf_token even though the JS runtime accepts it.
type GradioClientOptions = Parameters<typeof Client.connect>[1];

function getClientOptions(): GradioClientOptions | undefined {
  const token = process.env.NEXT_PUBLIC_HF_TOKEN?.trim();
  // TEMPORARY DEBUG -- remove once confirmed working. Logs whether a token
  // was found and its length (not the value itself) so you can confirm
  // it's actually reaching this code without exposing it in a screenshot.
  console.log("[live-api] HF token present:", !!token, token ? `(length ${token.length})` : "");
  if (!token) return undefined;
  return { hf_token: token } as unknown as GradioClientOptions;
}

export interface FrameResult {
  frame_idx: number;
  timestamp_s: number;
  detections: { class: string; confidence: number; box: [number, number, number, number] }[];
}

// NOTE: this uses the official @gradio/client library, not raw fetch/SSE --
// the backend is a plain Gradio Space (see backend/README.md for why). Run
// `npm install @gradio/client` if it's not already in package.json.

export async function inferImage(modelName: ModelName, imageBlob: Blob): Promise<Detection[]> {
  const client = await Client.connect(getSpaceUrl(), getClientOptions());
  const result = await client.predict("/infer_image", [imageBlob, modelName]);
  const data = result.data as unknown[];
  return (data[0] as Detection[]) ?? [];
}

// Streams progressively -- calls onFrames each time the backend's generator
// yields a new (growing) batch of results. `videoFile` is a real uploaded
// video (Blob/File) now, not a clip name -- the backend accepts direct
// uploads via gr.Video. Returns a function to cancel the job early if the
// caller navigates away mid-stream.
export function streamVideoJob(
  modelName: ModelName,
  videoFile: Blob,
  onFrames: (frames: FrameResult[]) => void,
  onDone: () => void,
  onError?: (e: unknown) => void
): () => void {
  let cancelled = false;

  (async () => {
    try {
      const client = await Client.connect(getSpaceUrl(), getClientOptions());
      const submission = client.submit("/infer_video", [videoFile, modelName]);

      for await (const event of submission) {
        if (cancelled) break;
        // @gradio/client emits several event types as a job progresses;
        // "data" carries each yield from the Python generator. Verify this
        // shape against your installed @gradio/client version -- streaming
        // generator event formats have changed across major versions, so
        // this may need adjusting if events don't show up as expected.
        if (event.type === "data") {
          const eventData = (event as unknown as { data: unknown[] }).data;
          const frames = eventData?.[0] as FrameResult[] | { error: string } | undefined;
          if (Array.isArray(frames)) onFrames(frames);
          else if (frames && "error" in frames) throw new Error(frames.error);
        }
      }
      if (!cancelled) onDone();
    } catch (e) {
      if (!cancelled) onError?.(e);
    }
  })();

  return () => {
    cancelled = true;
  };
}

export async function checkHealth() {
  const client = await Client.connect(getSpaceUrl(), getClientOptions());
  const result = await client.predict("/health", []);
  const data = result.data as unknown[];
  return data[0] as { status: string; models_loaded: string[] };
}
// ---------------------------------------------------------------------------
// Multi-object tracking. Returns track ROWS, not an annotated video -- the
// Space deliberately skips server-side encoding (see infer_video_track in
// backend/visiodect-api/app.py) because encoding cost more GPU time than the
// inference did. The caller draws the boxes over the source clip locally.
// ---------------------------------------------------------------------------

/** [frame, track_id, class_id, confidence, cx, cy, w, h] */
export type TrackRow = [number, number, number, number, number, number, number, number];

export interface TrackResult {
  width: number;
  height: number;
  fps: number;
  frames: number;
  classes: string[];
  tracker: string;
  model: string;
  imgsz: number;
  conf: number;
  unique_ids: number;
  inference_seconds: number;
  rows: TrackRow[];
  /** True when the Space served a previously computed result for this file. */
  cached: boolean;
}

// The Space serves one more checkpoint than the Part A comparison does:
// "dinov3_rho20" is the same YOLOv26-s architecture fine-tuned on 20% of the
// labels from a self-supervised backbone. It is kept OUT of ModelName so the
// Part A pages -- which index per-model metrics, labels and hardware specs by
// that type -- stay exhaustive and type-safe.
export type InferenceModelName = ModelName | "dinov3_rho20";

export interface TrackOptions {
  model?: InferenceModelName;
  tracker?: "bytetrack" | "botsort";
  /** Lower costs less GPU. 960 keeps the notebook's ID count on our clip. */
  imgsz?: number;
  conf?: number;
}

export async function inferVideoTrack(
  videoFile: Blob,
  options: TrackOptions = {}
): Promise<TrackResult> {
  const {
    model = "yolov26",
    tracker = "bytetrack",
    imgsz = 960,
    conf = 0.08,
  } = options;
  const client = await Client.connect(getSpaceUrl(), getClientOptions());
  const result = await client.predict("/infer_video_track", [
    videoFile,
    model,
    tracker,
    imgsz,
    conf,
  ]);
  const payload = (result.data as unknown[])[0] as TrackResult | undefined;
  if (!payload || !Array.isArray(payload.rows)) {
    throw new Error("Tracking returned no rows — the Space may have rejected the clip.");
  }
  return payload;
}
