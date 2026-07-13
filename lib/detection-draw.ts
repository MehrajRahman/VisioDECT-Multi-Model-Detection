import { Detection } from "./types";

// Distinct color per class, derived from a simple string hash so it's
// stable across renders/components without a hardcoded per-dataset class
// list. Used identically by both the image and video detection views so
// the same class always gets the same color across the app.
export function colorForLabel(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 85%, 55%)`;
}

// Draws boxes + labels onto a canvas 2D context. `scaleX`/`scaleY` convert
// from the detection's source-pixel coordinates (the actual image/frame the
// model ran on) to the canvas's displayed size -- pass 1/1 if they already
// match.
export function drawDetections(
  ctx: CanvasRenderingContext2D,
  detections: Detection[],
  scaleX: number,
  scaleY: number
) {
  for (const det of detections) {
    const [x1, y1, x2, y2] = det.box;
    const color = colorForLabel(det.class);
    const rx = x1 * scaleX;
    const ry = y1 * scaleY;
    const rw = (x2 - x1) * scaleX;
    const rh = (y2 - y1) * scaleY;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);

    const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
    ctx.font = "12px sans-serif";
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = color;
    ctx.fillRect(rx, ry - 16, textWidth + 8, 16);
    ctx.fillStyle = "#fff";
    ctx.fillText(label, rx + 4, ry - 4);
  }
}

// Counts the number of detections per class in a given frame.
// Returns an object like { "drone": 2, "bird": 1 }
export function countByClass(detections: Detection[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const det of detections) {
    counts[det.class] = (counts[det.class] || 0) + 1;
  }
  
  return counts;
}