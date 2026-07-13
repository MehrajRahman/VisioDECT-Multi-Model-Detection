"use client";

import { useState } from "react";
import ImageDetection from "@/components/ImageDetection";
import VideoDetection from "@/components/VideoDetection";

export default function LivePage() {
  const [tab, setTab] = useState<"image" | "video">("image");

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-3xl font-semibold">Live Drone Detection</h1>

      <div className="flex gap-2 border-b border-white/10">
        {(["image", "video"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-indigo-500 text-white" : "border-transparent opacity-60 hover:opacity-90"
            }`}
          >
            {t === "image" ? "Image" : "Video"}
          </button>
        ))}
      </div>

      {tab === "image" ? <ImageDetection /> : <VideoDetection />}
    </main>
  );
}

