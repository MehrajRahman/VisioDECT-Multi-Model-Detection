// import { Client, handle_file } from "@gradio/client"; 
// import { Detection, ModelName } from "./types";

// const DEFAULT_BACKEND_URL = "https://rahmanmehraj627-visiodect-api.hf.space";

// function getSpaceUrl(): string {
//   const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
//   return configured && configured.length > 0 ? configured : DEFAULT_BACKEND_URL;
// }

// // Cast to `any` to prevent TS error 2559. The JS client expects `hf_token`, 
// // but the TS types in your specific library version are missing it!
// // Extract the exact options type that Client.connect expects
// type GradioClientOptions = Parameters<typeof Client.connect>[1];

// // Cast through `unknown` to safely bypass strict overlapping checks
// // without triggering ESLint's "no-explicit-any" rule!
// function getClientOptions(): GradioClientOptions {
//     console.log("My Token is:", process.env.NEXT_PUBLIC_HF_TOKEN); // Check your browser console!
  
//   return {
//     hf_token: process.env.NEXT_PUBLIC_HF_TOKEN,
//   } as unknown as GradioClientOptions;
// }

// export interface FrameResult {
//   frame_idx: number;
//   timestamp_s: number;
//   detections: { class: string; confidence: number; box: [number, number, number, number] }[];
// }

// export async function inferImage(modelName: ModelName, imageBlob: Blob): Promise<Detection[]> {
//   // 1. Pass the token config
//   const client = await Client.connect(getSpaceUrl(), getClientOptions());  
  
//   // 2. Wrap imageBlob with handle_file() to be safe
//   const result = await client.predict("/infer_image", [handle_file(imageBlob), modelName]);
  
//   const data = result.data as unknown[];
//   return (data[0] as Detection[]) ?? [];
// }

// export function streamVideoJob(
//   modelName: ModelName,
//   videoFile: Blob,
//   onFrames: (frames: FrameResult[]) => void,
//   onDone: () => void,
//   onError?: (e: unknown) => void
// ): () => void {
//   let cancelled = false;

//   (async () => {
//     try {
//       // 1. Pass the token config here too!
//       const client = await Client.connect(getSpaceUrl(), getClientOptions());
      
//       // 2. Wrap handle_file in an object with a 'video' key for Pydantic validation
//       const submission = client.submit("/infer_video", [
//         { video: handle_file(videoFile) }, 
//         modelName
//       ]);

//       for await (const event of submission) {
//         if (cancelled) break;
//         if (event.type === "data") {
//           const eventData = (event as unknown as { data: unknown[] }).data;
//           const frames = eventData?.[0] as FrameResult[] | { error: string } | undefined;
//           if (Array.isArray(frames)) onFrames(frames);
//           else if (frames && "error" in frames) throw new Error(frames.error);
//         }
//       }
//       if (!cancelled) onDone();
//     } catch (e) {
//       if (!cancelled) onError?.(e);
//     }
//   })();

//   return () => {
//     cancelled = true;
//   };
// }

// export async function checkHealth() {
//   // 1. Pass the token config
//   const client = await Client.connect(getSpaceUrl(), getClientOptions());
  
//   const result = await client.predict("/health", []);
//   const data = result.data as unknown[];
//   return data[0] as { status: string; models_loaded: string[] };
// }

import { Client } from "@gradio/client";
import { Detection, ModelName } from "./types";

const DEFAULT_BACKEND_URL = "https://huggingface.co/spaces/rahmanmehraj627/visiodect-api";

function getSpaceUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configured && configured.length > 0 ? configured : DEFAULT_BACKEND_URL;
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
  const client = await Client.connect(getSpaceUrl());
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
      const client = await Client.connect(getSpaceUrl());
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
  const client = await Client.connect(getSpaceUrl());
  const result = await client.predict("/health", []);
  const data = result.data as unknown[];
  return data[0] as { status: string; models_loaded: string[] };
}