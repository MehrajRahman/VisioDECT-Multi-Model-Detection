"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { inferVideoTrack, InferenceModelName, TrackResult, TrackRow } from "@/lib/live-api";

const ID_COLORS = [
  "#3987e5", "#d95926", "#199e70", "#c98500",
  "#d55181", "#008300", "#9085e9", "#e66767",
];
const colorForId = (id: number) => ID_COLORS[(id - 1) % ID_COLORS.length];

const MAX_SECONDS = 30; // mirrors TRACK_MAX_SECONDS in the Space

type Status = "idle" | "checking" | "running" | "done" | "error";

export default function LiveTrackDemo() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);

  const [tracker, setTracker] = useState<"bytetrack" | "botsort">("bytetrack");
  const [imgsz, setImgsz] = useState(960);
  // Defaults to the detector the tracking study actually deployed, not the
  // full-label Part A model.
  const [model, setModel] = useState<InferenceModelName>("dinov3_rho20");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const byFrame = useRef<Map<number, TrackRow[]>>(new Map());

  // Derived rather than set from an effect: assigning state synchronously
  // inside an effect triggers a cascading render. The cleanup below revokes
  // the previous URL so repeated uploads during a demo don't leak decoded
  // video into memory.
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl]
  );

  useEffect(() => {
    const index = new Map<number, TrackRow[]>();
    for (const row of result?.rows ?? []) {
      const list = index.get(row[0]);
      if (list) list.push(row);
      else index.set(row[0], [row]);
    }
    byFrame.current = index;
  }, [result]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== result.width) {
      canvas.width = result.width;
      canvas.height = result.height;
    }
    ctx.clearRect(0, 0, result.width, result.height);

    for (const [, id, cls, conf, cx, cy, w, h] of byFrame.current.get(frame) ?? []) {
      const color = colorForId(id);
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

      const label = `#${id} ${result.classes[cls] ?? cls} ${conf.toFixed(2)}`;
      ctx.font = "600 26px ui-monospace, monospace";
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(cx - w / 2 - 2, cy - h / 2 - 38, tw + 18, 34);
      ctx.fillStyle = "#08111f";
      ctx.fillText(label, cx - w / 2 + 7, cy - h / 2 - 13);
    }
  }, [frame, result]);

  useEffect(() => {
    draw();
  }, [draw]);

  // The video element drives the frame counter so boxes cannot drift.
  useEffect(() => {
    if (!result) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v && !v.paused) {
        setFrame(Math.min(result.frames - 1, Math.round(v.currentTime * result.fps)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  /** Reject over-long clips locally, before the Space reserves any GPU. */
  function checkDuration(f: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.onloadedmetadata = () => {
        URL.revokeObjectURL(probe.src);
        resolve(probe.duration);
      };
      probe.onerror = () => reject(new Error("Could not read that file as video."));
      probe.src = URL.createObjectURL(f);
    });
  }

  async function onPick(f: File | null) {
    setResult(null);
    setMessage(null);
    setStatus("idle");
    setFrame(0);
    if (!f) {
      setFile(null);
      return;
    }
    setStatus("checking");
    try {
      const duration = await checkDuration(f);
      if (duration > MAX_SECONDS) {
        setStatus("error");
        setMessage(
          `That clip is ${duration.toFixed(1)}s. The limit is ${MAX_SECONDS}s — trim it first. ` +
            `Rejected here, so no GPU time was used.`
        );
        setFile(null);
        return;
      }
      setFile(f);
      setStatus("idle");
      setMessage(`${duration.toFixed(1)}s clip ready.`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  async function run() {
    if (!file) return;
    setStatus("running");
    setMessage("Uploading and tracking — this takes roughly 20–40 s end to end.");
    try {
      const payload = await inferVideoTrack(file, {
        model,
        tracker,
        imgsz,
      });
      setResult(payload);
      setStatus("done");
      setMessage(null);
      setFrame(0);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }

  const busy = status === "running" || status === "checking";

  return (
    <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0d1122] p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
            Clip (max {MAX_SECONDS}s)
          </span>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
            className="block text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-300 hover:file:bg-blue-500/25"
          />
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">Detector</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as InferenceModelName)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200"
          >
            <option value="dinov3_rho20">DINOv3 @ 20% labels — the study&apos;s detector</option>
            <option value="yolov26">YOLOv26-s — 100% labels</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">Tracker</span>
          <select
            value={tracker}
            onChange={(e) => setTracker(e.target.value as "bytetrack" | "botsort")}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200"
          >
            <option value="bytetrack">ByteTrack</option>
            <option value="botsort">BoT-SORT</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block text-xs uppercase tracking-wide text-slate-500">
            Inference size
          </span>
          <select
            value={imgsz}
            onChange={(e) => setImgsz(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200"
          >
            <option value={640}>640 — cheapest</option>
            <option value={960}>960 — recommended</option>
            <option value={1280}>1280 — notebook setting</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => void run()}
          disabled={!file || busy}
          className="rounded-xl bg-blue-500 px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
        >
          {status === "running" ? "Tracking…" : "Run tracking"}
        </button>
      </div>

      {message && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
            status === "error"
              ? "border-red-500/25 bg-red-500/[0.07] text-red-200"
              : "border-white/10 bg-white/[0.03] text-slate-300"
          }`}
        >
          {message}
        </p>
      )}

      {objectUrl && (
        <figure className="space-y-2">
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              src={objectUrl}
              controls
              muted
              playsInline
              className="aspect-video w-full"
            />
            {result && (
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />
            )}
          </div>
          <figcaption className="text-xs text-slate-500">
            {result
              ? "Your clip with track IDs drawn locally from the rows the Space returned."
              : "Press Run tracking to send this clip to the inference Space."}
          </figcaption>
        </figure>
      )}

      {result && (
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Track IDs", String(result.unique_ids)],
            ["Frames", String(result.frames)],
            ["GPU seconds", result.inference_seconds.toFixed(2)],
            ["Rows returned", result.rows.length.toLocaleString()],
            ["Served from cache", result.cached ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="mt-1 text-xl font-bold tabular-nums text-slate-100">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
