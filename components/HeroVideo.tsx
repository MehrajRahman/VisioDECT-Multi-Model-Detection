"use client";

import { useEffect, useRef } from "react";

// Decorative background video for the Part B hero. Client-side only because
// of the reduced-motion guard: an autoplaying loop is exactly the kind of
// thing prefers-reduced-motion exists to suppress, and CSS alone cannot stop
// playback. Falls back to a still first frame rather than nothing, so the
// hero never renders as an empty black panel.
export default function HeroVideo({
  src,
  className = "",
}: Readonly<{ src: string; className?: string }>) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      if (query.matches) {
        video.pause();
        // Park on a frame with drones in shot rather than the empty opening.
        if (video.readyState >= 1) video.currentTime = Math.min(2, video.duration || 2);
      } else {
        void video.play().catch(() => {
          /* autoplay blocked -- the poster frame is an acceptable result */
        });
      }
    };

    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      tabIndex={-1}
      className={className}
    />
  );
}
