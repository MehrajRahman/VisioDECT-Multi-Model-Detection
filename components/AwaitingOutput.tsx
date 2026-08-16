// Shown wherever a Part B JSON hasn't landed yet. This exists because the
// notebooks finish at different times and the dashboard has to be deployable
// mid-study -- a blank page would be indistinguishable from a broken one, so
// say which file is missing and how to produce it.

type AwaitingOutputProps = Readonly<{
  title: string;
  file: string;
  detail?: string;
}>;

export default function AwaitingOutput({ title, file, detail }: AwaitingOutputProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {detail && <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{detail}</p>}
      <p className="mt-4 text-xs text-slate-500">
        Expected at <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-400">data/metrics/{file}</code>
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Produce it with{" "}
        <code className="rounded bg-white/5 px-1.5 py-0.5 text-slate-400">
          python extract_partb.py --run-dir ./partb --out ./frontend/data/metrics --images-out
          ./frontend/public/model-images/partb
        </code>
      </p>
    </div>
  );
}
