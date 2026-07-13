import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelMetrics, getAllModelMetrics } from "@/lib/api";
import { MODEL_LABELS } from "@/lib/normalize";
import { ModelName } from "@/lib/types";
import { resolveModelImage } from "@/lib/image-assets";
import TrainingCurveChart from "@/components/TrainingCurveChart";

type ModelDetailPageProps = Readonly<{ params: Promise<{ model: string }> }>;

export function generateStaticParams() {
  return getAllModelMetrics().map((m) => ({ model: m.model }));
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { model } = await params;
  const validModels: ModelName[] = ["yolov10", "yolov12", "yolov26", "rfdetr"];
  if (!validModels.includes(model as ModelName)) notFound();

  const metrics = getModelMetrics(model as ModelName);
  const perClassRows = metrics.per_class ?? [];
  const confusionMatrixImageSrc = resolveModelImage(metrics.model, metrics.confusion_matrix_image, "confusion_matrix");
  const confusionMatrixTestImageSrc = resolveModelImage(
    metrics.model,
    metrics.confusion_matrix_test_image,
    "confusion_matrix_test"
  );
  const failureBreakdownImageSrc = resolveModelImage(
    metrics.model,
    metrics.failure_breakdown_image,
    "failure_breakdown"
  );
  const eigencamImageSrc = resolveModelImage(metrics.model, metrics.eigencam_image, "eigencam");

  const metricSummary = [
    {
      label: "mAP@50",
      value:
        typeof metrics.summary?.mAP50 === "number"
          ? `${(metrics.summary.mAP50 * 100).toFixed(1)}%`
          : typeof metrics.summary?.test_mAP50 === "number"
            ? `${(metrics.summary.test_mAP50 * 100).toFixed(1)}%`
            : "N/A",
    },
    {
      label: "Precision",
      value:
        typeof metrics.summary?.precision === "number"
          ? `${(metrics.summary.precision * 100).toFixed(1)}%`
          : typeof metrics.summary?.test_precision === "number"
            ? `${(metrics.summary.test_precision * 100).toFixed(1)}%`
            : "N/A",
    },
    {
      label: "Recall",
      value:
        typeof metrics.summary?.recall === "number"
          ? `${(metrics.summary.recall * 100).toFixed(1)}%`
          : typeof metrics.summary?.test_recall === "number"
            ? `${(metrics.summary.test_recall * 100).toFixed(1)}%`
            : "N/A",
    },
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-8 md:px-8 md:py-12">
      <div className="flex flex-wrap gap-2">
        <Link href="/" className="badge hover:bg-slate-100">
          Back to Dashboard
        </Link>
        <Link href="/live" className="badge hover:bg-slate-100">
          Go to Live Inference
        </Link>
      </div>

      <section className="glass-card rounded-3xl p-7 md:p-8">
        <p className="badge">Detailed Model Report</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">{MODEL_LABELS[metrics.model]}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Comprehensive diagnostics for the VisioDECT drone dataset including training behavior,
          confusion trends, failure analysis, and explainability artifacts.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {metricSummary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.08)] md:p-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Training Curve</h2>
        <TrainingCurveChart metrics={metrics} />
      </section>

      <section className="grid md:grid-cols-2 gap-6">
        {confusionMatrixImageSrc && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Confusion Matrix (val)</h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image
                src={confusionMatrixImageSrc}
                alt="Confusion matrix"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        )}
        {confusionMatrixTestImageSrc && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Confusion Matrix (held-out test)</h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image
                src={confusionMatrixTestImageSrc}
                alt="Confusion matrix, test set"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        )}
        {!confusionMatrixImageSrc && !confusionMatrixTestImageSrc && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 md:col-span-2">
            Confusion matrix artifacts are not available for this model export.
          </div>
        )}
      </section>

      {perClassRows.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] md:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Per-Class Metrics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  {Object.keys(perClassRows[0]).map((k) => (
                    <th key={k} className="py-2 pr-4 font-semibold uppercase tracking-wide text-xs">
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perClassRows.map((row, i) => (
                  <tr key={`${String(row.class)}-${i}`} className="border-b border-slate-100">
                    {Object.entries(row).map(([k, v]) => (
                      <td key={k} className="py-2 pr-4 text-slate-700">
                        {typeof v === "number"
                          ? v.toFixed(3)
                          : typeof v === "string"
                            ? v
                            : JSON.stringify(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {perClassRows.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
          Per-class metrics are not available for this model export.
        </section>
      )}

      <section className="grid md:grid-cols-2 gap-6">
        {failureBreakdownImageSrc && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Failure Breakdown</h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image
                src={failureBreakdownImageSrc}
                alt="Failure breakdown"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        )}
        {eigencamImageSrc && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">EigenCAM</h2>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <Image
                src={eigencamImageSrc}
                alt="EigenCAM"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
            </div>
          </div>
        )}
        {!failureBreakdownImageSrc && !eigencamImageSrc && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 md:col-span-2">
            Failure analysis images are not available for this model export.
          </div>
        )}
      </section>

      {metrics.summary && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] md:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Raw Summary</h2>
          <pre className="overflow-x-auto rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-700">
            {JSON.stringify(metrics.summary, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}