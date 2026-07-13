"use client";

import { useEffect, useRef, useState } from "react";
import { inferImage } from "@/lib/live-api";
import { resizeImageFile } from "@/lib/image-resize";
import { drawDetections } from "@/lib/detection-draw";
import { Detection, ModelName } from "@/lib/types";
import { MODEL_LABELS } from "@/lib/normalize";

const MODELS: ModelName[] = ["yolov10", "yolov12", "yolov26", "rfdetr"];

export default function ImageDetection() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [model, setModel] = useState<ModelName>("yolov12");
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [detections, setDetections] = useState<Detection[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("idle");
    setDetections([]);

    // Resize client-side BEFORE upload -- reduces payload size and upload
    // time, especially for phone-camera-sized images. The resized image
    // (not the original) is what's displayed and what boxes are drawn
    // against, so coordinates always line up exactly.
    const { blob } = await resizeImageFile(file, 640);
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    const url = URL.createObjectURL(blob);
    setResizedBlob(blob);
    setImageUrl(url);
  }

  async function handleRun() {
    if (!resizedBlob) return;
    setStatus("running");
    try {
      const result = await inferImage(model, resizedBlob);
      setDetections(result);
      setStatus("idle");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  // Redraw boxes whenever detections change or the displayed image size
  // changes (e.g. window resize) -- canvas coordinates must track the
  // rendered <img> size, not its natural pixel size.
  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    function draw() {
      const ctx = canvas!.getContext("2d");
      if (!ctx || !img) return;
      canvas!.width = img.clientWidth;
      canvas!.height = img.clientHeight;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      const scaleX = img.clientWidth / (img.naturalWidth || img.clientWidth);
      const scaleY = img.clientHeight / (img.naturalHeight || img.clientHeight);
      drawDetections(ctx, detections, scaleX, scaleY);
    }

    if (img.complete) draw();
    else img.addEventListener("load", draw, { once: true });

    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [detections, imageUrl]);

  return (
    <div className="space-y-6">
      <p className="opacity-70">
        Upload an image (resized to 640px client-side before upload) and pick a model to see
        detections drawn directly on it.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/*"
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
          onClick={handleRun}
          disabled={!resizedBlob || status === "running"}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg px-6 py-2 font-medium"
        >
          {status === "running" ? "Running…" : "Run"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm">
          Something went wrong reaching the inference backend. Check NEXT_PUBLIC_API_URL and that
          the HF Space is awake (ZeroGPU spaces can take ~30s to cold start).
        </p>
      )}

      {imageUrl && (
        <div className="relative inline-block max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={imageUrl} alt="Upload preview" className="max-w-full rounded-lg border border-white/10" />
          <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
        </div>
      )}

      {detections.length > 0 && (
        <p className="text-sm opacity-70">
          {detections.length} detection(s) — avg confidence{" "}
          {((detections.reduce((s, d) => s + d.confidence, 0) / detections.length) * 100).toFixed(1)}%
        </p>
      )}
    </div>
  );
}