import Link from "next/link";
import type { Metadata } from "next";
import {
  getPartBTracking,
  trackingAssetSrc,
  findMetric,
  partbFigureSrc,
  TrackerRun,
} from "@/lib/partb";
import TrackerComparisonTable from "@/components/TrackerComparisonTable";
import TrackingPlayer from "@/components/TrackingPlayer";
import AwaitingOutput from "@/components/AwaitingOutput";

export const metadata: Metadata = {
  title: "Tracking · VisioDECT",
  description:
    "Multi-object drone tracking with persistent IDs, comparing ByteTrack and BoT-SORT on the 20%-label DINOv3 detector.",
};

export default function TrackingPage() {
  const data = getPartBTracking();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        {/* The nav lists Part B once; these pages link back to the hub. */}
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Task 2
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Multi-object tracking with persistent IDs
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          The 20%-label detector deployed on a multi-drone clip, with three tracker
          configurations compared on the same detections — so any difference is the tracker&apos;s,
          not the detector&apos;s.
        </p>
      </header>

      {data === null ? (
        <AwaitingOutput
          title="Tracking results haven't been extracted yet"
          file="partb_tracking.json"
          detail="Download tracking_summary.json and the *_h264.mp4 clips from the Kaggle tracking notebook first."
        />
      ) : (
        <TrackingContent data={data} />
      )}
    </main>
  );
}

function TrackingContent({ data }: Readonly<{ data: NonNullable<ReturnType<typeof getPartBTracking>> }>) {
  const expected = data.expected_objects;

  // The headline finding is derived, not asserted: find the configuration
  // that produced the most spurious identities and the one that was fastest,
  // so the page still reads correctly if the tracker set changes.
  const withIds = data.runs
    .map((r) => ({ run: r, ids: findMetric(r, "unique_track_ids")?.value ?? null }))
    .filter((x): x is { run: TrackerRun; ids: number } => x.ids !== null);
  const worst = [...withIds].sort((a, b) => b.ids - a.ids)[0];
  const cleanest = [...withIds].sort((a, b) => a.ids - b.ids)[0];
  const reidHurts = worst && cleanest && worst.ids > cleanest.ids;

  const fastest = [...data.runs]
    .map((r) => ({ run: r, fps: findMetric(r, "fps_inference")?.value ?? null }))
    .filter((x): x is { run: TrackerRun; fps: number } => x.fps !== null)
    .sort((a, b) => b.fps - a.fps)[0];

  return (
    <>
      <section className="grid gap-4 rounded-3xl border border-white/10 bg-[#0d1122] p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
        {[
          ["Detector", data.detector],
          ["Clip", data.video],
          ["Properties", data.video_props],
          [
            "Inference size / conf",
            data.imgsz && data.track_conf ? `${data.imgsz} px @ ${data.track_conf}` : null,
          ],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-1 break-words font-mono text-sm text-slate-200">{value ?? "—"}</p>
          </div>
        ))}
      </section>

      {reidHurts && (
        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.06] p-6 sm:p-8">
          <p className="text-lg font-semibold leading-relaxed text-slate-100 sm:text-xl">
            Appearance re-identification made tracking <span className="text-amber-300">worse</span>.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            {worst.run.tracker} produced <span className="font-semibold">{worst.ids}</span> distinct
            track IDs for {expected ?? "the"} drones, against{" "}
            <span className="font-semibold">{cleanest.ids}</span> from {cleanest.run.tracker}
            {fastest && (
              <>
                , while running at {findMetric(worst.run, "fps_inference")?.value ?? "—"} fps versus{" "}
                {fastest.fps} fps for {fastest.run.tracker}
              </>
            )}
            . The drones in this dataset are small, low-contrast and near-identical to one another,
            so the appearance embeddings that ReID depends on carry little discriminative signal —
            it splits single tracks rather than joining them. Motion-only association is both
            cheaper and more accurate here.
          </p>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Interactive playback
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          The rendered clips each show one tracker and nothing else. Here the geometry is drawn
          from the exported per-frame data instead, so the tracker can be swapped at a fixed frame
          and two runs can be overlaid — which is the only way to see where their identity
          decisions actually diverge.
        </p>
        <TrackingPlayer
          trackerNames={data.runs.map((r) => r.tracker)}
          expectedObjects={expected}
          rawVideo={trackingAssetSrc("raw_source.mp4")}
        />
        <p className="text-sm text-slate-400">
          Want it on your own footage?{" "}
          <Link href="/live-track" className="text-blue-400 hover:text-blue-300">
            Run tracking live on an uploaded clip →
          </Link>{" "}
          <span className="text-slate-500">
            (calls the inference Space; this page stays fully offline)
          </span>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Annotated output
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {data.runs.map((run) => {
            const src = trackingAssetSrc(run.video);
            const ids = findMetric(run, "unique_track_ids")?.value;
            const fps = findMetric(run, "fps_inference")?.value;
            return (
              <figure key={run.tracker} className="space-y-3">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                  {src ? (
                    // Pre-rendered in the notebook and served as a static
                    // file: no inference at view time, so there is no GPU
                    // quota to exhaust and nothing to fail during a demo.
                    <video
                      src={src}
                      controls
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="aspect-video w-full"
                    />
                  ) : (
                    <p className="p-6 text-center text-sm text-slate-500">Clip not available</p>
                  )}
                </div>
                <figcaption className="space-y-1">
                  <p className="text-sm font-semibold text-slate-100">{run.tracker}</p>
                  <p className="text-xs text-slate-500">
                    {typeof ids === "number" && (
                      <>
                        {ids} track IDs
                        {typeof expected === "number" && ` for ${expected} drones`}
                      </>
                    )}
                    {typeof fps === "number" && <> · {fps} fps</>}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {data.detection_only_video && (
          <details className="rounded-2xl border border-white/10 bg-[#0d1122] p-5">
            <summary className="cursor-pointer text-sm font-medium text-slate-200">
              Detection-only baseline (no tracking)
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
              The same detector run frame by frame with no association step. Boxes appear and
              disappear with no identity carried between frames — this is what the trackers above
              are adding.
            </p>
            <video
              src={trackingAssetSrc(data.detection_only_video) ?? undefined}
              controls
              loop
              muted
              playsInline
              preload="none"
              className="mt-4 aspect-video w-full rounded-xl border border-white/10 bg-black"
            />
          </details>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Tracker metrics
        </h2>
        <TrackerComparisonTable runs={data.runs} expectedObjects={expected} />
        <p className="text-xs text-slate-500">
          All three configurations share the same detector and the same clip, so differences are
          attributable to the association step alone. Read from{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5">{data.source_file}</code>.
        </p>
      </section>

      {data.figures.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Per-frame behaviour
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.figures.map((file) => (
              <figure key={file}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trackingAssetSrc(file) ?? partbFigureSrc(file) ?? ""}
                  alt={file.replace(/[_-]/g, " ").replace(/\.png$/, "")}
                  className="w-full rounded-lg border border-white/10 bg-white"
                />
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
