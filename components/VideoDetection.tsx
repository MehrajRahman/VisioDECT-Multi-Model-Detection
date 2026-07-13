"use client";

import { useEffect, useRef, useState } from "react";
import { streamVideoJob, FrameResult } from "@/lib/live-api";
import { drawDetections } from "@/lib/detection-draw";
import { ModelName } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/normalize";

const MODELS: ModelName[] = ["yolov10", "yolov12", "yolov26", "rfdetr"];

export default function VideoDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [model, setModel] = useState<ModelName>("yolov12");
  const [status, setStatus] = useState<"idle" | "streaming" | "error">("idle");
  const [frames, setFrames] = useState<FrameResult[]>([]);
  const cancelRef = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // NOTE: unlike images, this does NOT resize the video client-side before
  // upload -- true client-side video resizing/transcoding needs something
  // like ffmpeg.wasm (large, heavy to set up) rather than a simple canvas
  // trick. Frame-level resizing happens backend-side instead (see app.py) --
  // reduces backend compute and the annotated output video's size, though
  // not the initial upload payload. Worth revisiting with ffmpeg.wasm later
  // if upload size becomes a real problem for large source clips.
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setFrames([]);
    setStatus("idle");
  }

  function handleStart() {
    if (!file) return;
    setStatus("streaming");
    setFrames([]);
    cancelRef.current = streamVideoJob(
      model,
      file,
      (updatedFrames) => setFrames(updatedFrames), // backend yields the growing full list each batch
      () => setStatus("idle"),
      (e) => {
        console.error(e);
        setStatus("error");
      }
    );
  }

  // Draw whichever received frame's boxes are closest (without going past)
  // the video's current playback time, every time the video reports a
  // timeupdate. This is what makes it feel like live tracking instead of a
  // static result dump.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || frames.length === 0) return;

    function draw() {
      const ctx = canvas!.getContext("2d");
      if (!ctx || !video) return;
      canvas!.width = video.clientWidth;
      canvas!.height = video.clientHeight;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      const scaleX = video.clientWidth / (video.videoWidth || video.clientWidth);
      const scaleY = video.clientHeight / (video.videoHeight || video.clientHeight);

      let match: FrameResult | undefined;
      for (const f of frames) {
        if (f.timestamp_s <= video.currentTime) match = f;
        else break;
      }
      if (!match) return;
      drawDetections(ctx, match.detections, scaleX, scaleY);
    }

    let rafId: number;
    function loop() {
      draw();
      if (videoRef.current && !videoRef.current.paused) rafId = requestAnimationFrame(loop);
    }

    video.addEventListener("timeupdate", draw);
    video.addEventListener("play", loop);
    draw();

    return () => {
      video.removeEventListener("timeupdate", draw);
      video.removeEventListener("play", loop);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [frames]);

  const totalDetections = frames.reduce((sum, f) => sum + f.detections.length, 0);
  const avgConfidence =
    frames.length > 0
      ? frames
          .flatMap((f) => f.detections.map((d) => d.confidence))
          .reduce((a, b, _, arr) => a + b / arr.length, 0)
      : 0;

  return (
    <div className="space-y-6">
      <p className="opacity-70">
        Upload a short drone clip and pick a model. Detections stream in as the backend processes
        batches of frames, and boxes overlay the video as it plays.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-500"
        />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as ModelName)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"
        >
          {MODELS.map((m) => (
            <option key={m} value={m}>
              {MODEL_LABELS[m]}
            </option>
          ))}
        </select>
        <button
          onClick={handleStart}
          disabled={!file || status === "streaming"}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg px-6 py-2 font-medium"
        >
          {status === "streaming" ? "Processing…" : "Run"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm">
          Something went wrong reaching the inference backend. Check NEXT_PUBLIC_API_URL and that
          the HF Space is awake (ZeroGPU spaces can take ~30s to cold start).
        </p>
      )}

      {videoUrl && (
        <div className="relative inline-block max-w-full">
          <video ref={videoRef} src={videoUrl} controls className="max-w-full rounded-lg border border-white/10" />
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        </div>
      )}

      {frames.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-2xl font-semibold">{frames.length}</p>
            <p className="text-xs opacity-60">frames processed</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-2xl font-semibold">{totalDetections}</p>
            <p className="text-xs opacity-60">total detections</p>
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="text-2xl font-semibold">{(avgConfidence * 100).toFixed(1)}%</p>
            <p className="text-xs opacity-60">avg confidence</p>
          </div>
        </div>
      )}
    </div>
  );
}