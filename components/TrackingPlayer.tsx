"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackingAssetSrc } from "@/lib/partb-types";

// Row layout matches build_track_frames() in extract_partb.py -- a positional
// array rather than objects, which is what keeps 3,658 rows under ~105 KB.
type Row = [
  frame: number, id: number, cls: number, conf: number,
  cx: number, cy: number, w: number, h: number,
];

interface TrackerPayload {
  video: string | null;
  unique_ids: number;
  /** Frames where an ID appears for the first time after frame 0. */
  births: number[];
  rows: Row[];
}

interface TracksPayload {
  width: number;
  height: number;
  fps: number;
  frames: number;
  classes: string[];
  trackers: Record<string, TrackerPayload>;
}

// Dark-surface categorical steps, validated against the #0d1122 card
// background. Track identity is ALWAYS also written as a numeric label, so
// beyond eight concurrent IDs the reused hue is never the only cue -- which
// matters here because the ReID run reaches thirteen.
const ID_COLORS = [
  "#3987e5", "#d95926", "#199e70", "#c98500",
  "#d55181", "#008300", "#9085e9", "#e66767",
];
const colorForId = (id: number) => ID_COLORS[(id - 1) % ID_COLORS.length];

const TRAIL_FRAMES = 36; // 1.5 s at 24 fps

export default function TrackingPlayer({
  trackerNames,
  expectedObjects,
  rawVideo,
}: Readonly<{
  trackerNames: string[];
  expectedObjects: number | null;
  /** Unannotated source clip. When present the boxes are drawn over the real
      footage, which is the actual tracking demonstration; the notebook's
      pre-rendered clips can only ever show one tracker with boxes baked in. */
  rawVideo: string | null;
}>) {
  const [data, setData] = useState<TracksPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracker, setTracker] = useState(trackerNames[0] ?? "");
  const [compare, setCompare] = useState<string | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  // "live" overlays geometry on the raw clip; "render" shows the notebook's
  // own burned-in output for comparison.
  const [view, setView] = useState<"live" | "render">(rawVideo ? "live" : "render");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 105 KB, fetched on mount rather than serialised into the server-rendered
  // payload so the rest of the page paints immediately.
  useEffect(() => {
    let cancelled = false;
    fetch("/partb-tracking/tracks.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((json: TracksPayload) => !cancelled && setData(json))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  // Frame -> rows, built once per tracker. Scanning 1,200 rows every animation
  // frame would be wasteful at 24 fps.
  const byFrame = useMemo(() => {
    const out = new Map<string, Map<number, Row[]>>();
    if (!data) return out;
    for (const [name, payload] of Object.entries(data.trackers)) {
      const index = new Map<number, Row[]>();
      for (const row of payload.rows) {
        const list = index.get(row[0]);
        if (list) list.push(row);
        else index.set(row[0], [row]);
      }
      out.set(name, index);
    }
    return out;
  }, [data]);

  const overlaying = view === "live" && Boolean(rawVideo);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = data;
    if (canvas.width !== width) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.clearRect(0, 0, width, height);

    // Only paint a backdrop when there is no footage underneath; over the raw
    // clip the canvas must stay transparent.
    if (!overlaying) {
      ctx.fillStyle = "#080b18";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x += width / 12) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += height / 7) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    const drawTracker = (name: string, ghost: boolean) => {
      const index = byFrame.get(name);
      if (!index) return;

      // Trail: the same ID's recent centroids, fading with age.
      if (!ghost) {
        for (let f = Math.max(0, frame - TRAIL_FRAMES); f < frame; f++) {
          const age = (frame - f) / TRAIL_FRAMES;
          for (const [, id, , , cx, cy] of index.get(f) ?? []) {
            ctx.globalAlpha = (1 - age) * 0.5;
            ctx.fillStyle = colorForId(id);
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      for (const [, id, cls, conf, cx, cy, w, h] of index.get(frame) ?? []) {
        const x = cx - w / 2;
        const y = cy - h / 2;
        const color = colorForId(id);

        ctx.lineWidth = ghost ? 3 : 5;
        ctx.strokeStyle = color;
        ctx.globalAlpha = ghost ? 0.65 : 1;
        ctx.setLineDash(ghost ? [12, 10] : []);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);

        if (!ghost) {
          const label = `#${id} ${data.classes[cls] ?? cls} ${conf.toFixed(2)}`;
          ctx.font = "600 26px ui-monospace, monospace";
          const tw = ctx.measureText(label).width;
          ctx.fillStyle = color;
          ctx.fillRect(x - 2, y - 38, tw + 18, 34);
          ctx.fillStyle = "#08111f";
          ctx.fillText(label, x + 7, y - 13);
        }
        ctx.globalAlpha = 1;
      }
    };

    if (compare && compare !== tracker) drawTracker(compare, true);
    drawTracker(tracker, false);
  }, [byFrame, compare, data, frame, tracker, overlaying]);

  useEffect(() => {
    draw();
  }, [draw]);

  // The <video> owns the clock while playing, so the canvas and the burned-in
  // annotation can never drift apart.
  useEffect(() => {
    if (!playing || !data) return;
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      if (v && !v.paused) setFrame(Math.min(data.frames - 1, Math.round(v.currentTime * data.fps)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, data]);

  function seek(nextFrame: number) {
    setFrame(nextFrame);
    const v = videoRef.current;
    if (v && data) v.currentTime = nextFrame / data.fps;
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-white/10 bg-[#0d1122] p-6 text-sm text-slate-400">
        Could not load track data ({error}). The annotated clips above still play.
      </p>
    );
  }
  if (!data) {
    return (
      <p className="rounded-2xl border border-white/10 bg-[#0d1122] p-6 text-sm text-slate-500">
        Loading track geometry…
      </p>
    );
  }

  const active = byFrame.get(tracker)?.get(frame)?.length ?? 0;
  const current = data.trackers[tracker];
  // Live view plays the untouched source; render view plays the notebook's
  // own burned-in output so the two can be compared directly.
  const videoSrc = overlaying ? rawVideo : trackingAssetSrc(current?.video);
  const seconds = (frame / data.fps).toFixed(2);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0d1122] p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-slate-500">Tracker</span>
        {trackerNames.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTracker(name)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              name === tracker
                ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
            }`}
          >
            {name}
            <span className="ml-2 tabular-nums text-slate-500">
              {data.trackers[name]?.unique_ids} IDs
            </span>
          </button>
        ))}
      </div>

      {rawVideo && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs uppercase tracking-wide text-slate-500">View</span>
          {([["live", "Live overlay on source"], ["render", "Notebook render"]] as const).map(
            ([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === mode
                    ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs uppercase tracking-wide text-slate-500">Ghost overlay</span>
        <button
          type="button"
          onClick={() => setCompare(null)}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            compare === null
              ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
              : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
          }`}
        >
          Off
        </button>
        {trackerNames
          .filter((n) => n !== tracker)
          .map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCompare(name)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                compare === name
                  ? "border-blue-500/50 bg-blue-500/15 text-blue-300"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
              }`}
            >
              {name}
            </button>
          ))}
      </div>

      <figure className="space-y-2">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
          <video
            ref={videoRef}
            src={videoSrc ?? undefined}
            playsInline
            muted
            preload="auto"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="aspect-video w-full"
          />
          {/* Boxes are drawn on a transparent canvas stretched over the video
              rather than encoded into it, so the tracker can be swapped
              mid-playback on identical footage. pointer-events-none keeps the
              video's own controls reachable underneath. */}
          {overlaying && (
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
          )}
        </div>
        <figcaption className="text-xs text-slate-500">
          {overlaying ? (
            <>
              Unannotated source clip with {tracker} drawn live from the exported track data
              {compare && compare !== tracker && <> · dashed boxes are {compare}</>}.
            </>
          ) : (
            <>Notebook render for {tracker} — boxes burned into the clip.</>
          )}
        </figcaption>
      </figure>

      {!overlaying && (
        <figure className="space-y-2">
          <canvas
            ref={canvasRef}
            className="aspect-video w-full rounded-xl border border-white/10 bg-[#080b18]"
          />
          <figcaption className="text-xs text-slate-500">
            Track geometry alone, same frame.
          </figcaption>
        </figure>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          className="rounded-lg border border-blue-500/40 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-300"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={data.frames - 1}
          value={frame}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Frame"
          className="h-1.5 min-w-[12rem] flex-1 cursor-pointer accent-blue-500"
        />
        <span className="font-mono text-xs tabular-nums text-slate-400">
          frame {String(frame).padStart(3, "0")}/{data.frames - 1} · {seconds}s
        </span>
        <span className="font-mono text-xs tabular-nums text-slate-400">
          {active} active
          {typeof expectedObjects === "number" && ` / ${expectedObjects} expected`}
        </span>
      </div>

      {current && current.births.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="text-xs uppercase tracking-wide text-slate-500">
            Jump to new track ID
          </span>
          {current.births.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => seek(f)}
              className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 font-mono text-xs text-amber-300 transition-colors hover:border-amber-500/50"
            >
              f{f}
            </button>
          ))}
          <span className="text-xs text-slate-500">
            {current.births.length} after frame 0 — each is either a drone entering the frame or an
            identity failure.
          </span>
        </div>
      )}
    </div>
  );
}
