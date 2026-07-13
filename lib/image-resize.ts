// Resizes an image file client-side before it's uploaded for inference,
// reducing payload size and upload time. Keeps aspect ratio, longest side
// capped at maxDim (640 by default -- matches the YOLO models' native input
// size; RF-DETR's own preprocessing will further resize down to its actual
// 384px working resolution regardless, so this is a safe upper bound for
// all four models, not a precise per-model target).
export async function resizeImageFile(
  file: File,
  maxDim = 640
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Failed to encode resized image");

  return { blob, width, height };
}