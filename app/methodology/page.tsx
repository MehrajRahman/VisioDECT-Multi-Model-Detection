import Link from "next/link";
import type { Metadata } from "next";
import { getPartBPretraining, partbFigureSrc, toPct, PretrainMethod } from "@/lib/partb";
import AwaitingOutput from "@/components/AwaitingOutput";

export const metadata: Metadata = {
  title: "Methodology · VisioDECT",
  description:
    "The leakage-safe partition, the frozen fine-tuning protocol, and the self-supervised pretraining runs behind the Part B results.",
};

// One sentence per objective. These describe the methods, not our results --
// no measured number lives here; those all come out of the JSON.
const OBJECTIVES: Record<string, string> = {
  simclr:
    "Two augmented views of the same image are pulled together in embedding space while views of different images are pushed apart, using an NT-Xent contrastive loss over the in-batch negatives.",
  byol:
    "An online network predicts the target network's embedding of a second view, with the target updated as an exponential moving average — no negative pairs, so no reliance on large batches.",
  ijepa:
    "Masked target blocks are predicted in representation space rather than pixel space, from a single context block, which avoids spending capacity on pixel-level detail the detector never uses.",
  dinov3:
    "Self-distillation with no labels: a student matches a teacher's output distribution across global and local crops, with the teacher an EMA of the student.",
};

const FIGURE_LABELS: Record<string, string> = {
  loss_curve: "Pretraining loss",
  tsne: "t-SNE of embeddings",
  retrieval: "Nearest-neighbour retrieval",
  views: "Augmented views",
};

export default function MethodologyPage() {
  const data = getPartBPretraining();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-12 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        {/* The nav lists Part B once; these pages link back to the hub. */}
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">Methodology</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          How the study was partitioned, what was held constant across every run, and what each
          self-supervised objective actually learned.
        </p>
      </header>

      {data === null ? (
        <AwaitingOutput
          title="Pretraining summaries haven't been extracted yet"
          file="partb_pretraining.json"
          detail="Download the *_pretrain_summary.json files, partition_manifest.json, and the figure PNGs from the Kaggle notebooks first."
        />
      ) : (
        <MethodologyContent data={data} />
      )}
    </main>
  );
}

function MethodologyContent({
  data,
}: Readonly<{ data: NonNullable<ReturnType<typeof getPartBPretraining>> }>) {
  const partition = data.partition;
  const fingerprint = partition?.fingerprint ?? null;
  // Absent means "no notebook reported one", which is not the same as
  // "reported and disagreed" -- only the latter is a warning.
  const fingerprintConsistent = partition?.fingerprint_consistent !== false;

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          The partition
        </h2>
        <div className="rounded-2xl border border-white/10 bg-[#0d1122] p-6 sm:p-8">
          {partition ? (
            <dl className="grid gap-6 sm:grid-cols-4">
              {(
                [
                  ["Seed", partition.seed],
                  ["SSL pool (80%)", partition.pool_images ?? partition.ssl_pool_images],
                  ["Validation (10%)", partition.val_images],
                  ["Test (10%)", partition.test_images],
                ] as Array<[string, number | undefined]>
              ).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-slate-100">
                    {typeof value === "number" ? value.toLocaleString() : "—"}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-400">
              No <code className="text-slate-300">partition_manifest.json</code> was extracted, so
              the split counts are unavailable.
            </p>
          )}

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-slate-400">
            The fine-tuning images are drawn from the same pool the backbone was pretrained on, and
            that is not leakage: self-supervised pretraining never reads a bounding box. The
            backbone saw those pixels with no idea where the drones were. What must never overlap
            is the validation and test splits, and those 10% slices are held out of the SSL pool
            entirely.
          </p>

          {fingerprint && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Partition fingerprint</p>
              <code className="mt-1 block break-all font-mono text-sm text-slate-300">
                {fingerprint}
              </code>
              <p className="mt-2 text-xs text-slate-500">
                {fingerprintConsistent ? (
                  <>Identical across every Part B notebook that reported one — the runs are comparable.</>
                ) : (
                  <span className="text-amber-300/90">
                    Warning: notebooks reported differing fingerprints, so the runs may not share a
                    partition.
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Frozen fine-tuning protocol
        </h2>
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#0d1122] p-6 sm:grid-cols-4 lg:grid-cols-8">
          {Object.entries(data.protocol ?? {}).map(([key, value]) => (
            <div key={key}>
              <p className="text-xs uppercase tracking-wide text-slate-500">{key}</p>
              <p className="mt-1 font-mono text-lg text-slate-100">{String(value)}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Identical across all six initialisations, so any difference in the results is attributable
          to the backbone weights rather than the fine-tuning recipe.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Pretraining runs
        </h2>
        {data.methods.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
            No pretraining summaries have been extracted yet.
          </p>
        ) : (
          <div className="space-y-6">
            {data.methods.map((m) => (
              <MethodCard key={m.method} method={m} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function MethodCard({ method }: Readonly<{ method: PretrainMethod }>) {
  const figures = Object.entries(method.figures ?? {}).filter(([, file]) => Boolean(file));

  return (
    <article className="rounded-2xl border border-white/10 bg-[#0d1122] p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-xl font-bold tracking-tight text-slate-50">{method.label}</h3>
        <p className="font-mono text-xs text-slate-500">{method.source_file}</p>
      </div>

      {OBJECTIVES[method.method] && (
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          {OBJECTIVES[method.method]}
        </p>
      )}

      {method.caveat && (
        <p className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm leading-relaxed text-amber-200/90">
          {method.caveat}
        </p>
      )}

      <dl className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Epochs", method.epochs],
          ["Image size", method.image_size],
          ["Seed", method.seed],
          ["Pool images", method.ssl_pool_images],
          ["Best loss", method.best_loss],
          ["Train (min)", method.train_minutes],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{String(label)}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-slate-100">
              {typeof value === "number"
                ? label === "Best loss"
                  ? value.toFixed(4)
                  : value.toLocaleString(undefined, { maximumFractionDigits: 1 })
                : "—"}
            </dd>
          </div>
        ))}
      </dl>

      {method.diagnostics && (
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Retrieval control
          </p>
          <div className="mt-3 flex flex-wrap gap-8">
            <div>
              <p className="text-xs text-slate-500">Unrestricted top-1</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-100">
                {toPct(method.diagnostics.retrieval_top1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cross-scenario top-1</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-blue-400">
                {toPct(method.diagnostics.cross_scenario_top1)}
              </p>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
            VisioDECT is built from video, so an image&apos;s nearest neighbour is often the
            adjacent frame — a retrieval score that mostly measures near-duplicate matching would
            flatter any method. The cross-scenario number restricts each query&apos;s neighbours to
            a different lighting scenario. The gap between the two is how much of the unrestricted
            score was near-duplicates; the cross-scenario figure is the one that reflects learned
            semantics.
          </p>
        </div>
      )}

      {figures.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {figures.map(([kind, file]) => {
            const src = partbFigureSrc(file);
            if (!src) return null;
            return (
              <figure key={kind} className="space-y-2">
                {/* Plain <img>: these are notebook-rendered PNGs of unknown
                    intrinsic size, matching how TrainingCurveChart falls back. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${method.label} ${FIGURE_LABELS[kind] ?? kind}`}
                  className="w-full rounded-lg border border-white/10 bg-white"
                />
                <figcaption className="text-xs text-slate-500">
                  {FIGURE_LABELS[kind] ?? kind}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
    </article>
  );
}
