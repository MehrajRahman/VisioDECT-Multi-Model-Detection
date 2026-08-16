import Link from "next/link";
import type { Metadata } from "next";
import { getProtocolAudit, AuditGroup, AuditVarying } from "@/lib/partb";
import AwaitingOutput from "@/components/AwaitingOutput";

export const metadata: Metadata = {
  title: "Protocol Audit · VisioDECT",
  description:
    "An automated diff of every fine-tuning run's configuration, verifying that only the backbone initialisation and the label fraction varied.",
};

export default function ProtocolPage() {
  const audit = getProtocolAudit();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-10 bg-[#060814] px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <Link
          href="/part-b"
          className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 hover:text-blue-300"
        >
          ← Part B · Fair comparison
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-slate-50 sm:text-4xl">
          Protocol audit
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
          The study only means anything if every run was trained identically. Rather than assert
          that, this page diffs the complete training configuration of every fine-tuning run
          against every other, key by key, and reports what actually differed.
        </p>
      </header>

      {audit === null ? (
        <AwaitingOutput
          title="No run configurations have been extracted yet"
          file="partb_protocol_audit.json"
          detail="Each Ultralytics run writes an args.yaml alongside its weights; the extractor finds them recursively."
        />
      ) : (
        <AuditContent audit={audit} />
      )}
    </main>
  );
}

function AuditContent({ audit }: Readonly<{ audit: NonNullable<ReturnType<typeof getProtocolAudit>> }>) {
  const permitted = audit.varying.filter((v) => v.expected);
  const unexpected = audit.varying.filter((v) => !v.expected);

  return (
    <>
      <section
        className={`rounded-3xl border p-6 sm:p-8 ${
          audit.compliant
            ? "border-emerald-500/25 bg-emerald-500/[0.06]"
            : "border-red-500/25 bg-red-500/[0.06]"
        }`}
      >
        <p className="text-lg font-semibold leading-relaxed text-slate-100 sm:text-xl">
          {audit.compliant ? (
            <>
              Across{" "}
              <span className="text-emerald-400">{audit.runs.length} fine-tuning runs</span>,{" "}
              <span className="text-emerald-400">
                {audit.constant_count} of {audit.total_keys}
              </span>{" "}
              configuration values are byte-identical. The{" "}
              {audit.varying.length} that differ are all direct consequences of the two variables
              the study is allowed to change.
            </>
          ) : (
            <>
              <span className="text-red-400">Protocol drift detected.</span>{" "}
              {unexpected.length} configuration{unexpected.length === 1 ? " value" : " values"}{" "}
              varied between runs without being a consequence of the backbone initialisation or the
              label fraction.
            </>
          )}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          Every Ultralytics training run writes a complete <code className="text-slate-300">args.yaml</code>{" "}
          next to its weights. Loading all {audit.runs.length} and diffing them turns the
          fair-comparison requirement from a claim in the report into something that can be
          checked — including by someone who doesn&apos;t trust the claim.
        </p>
      </section>

      {/* The seven groups below are the assignment's own categories, not ours --
          each maps onto the concrete config keys that carry it. */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Quantities required to be identical
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {audit.groups.map((group) => (
            <GroupCard key={group.label} group={group} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          What varied, and why
        </h2>
        <div className="space-y-3">
          {permitted.map((v) => (
            <VaryingRow key={v.key} varying={v} />
          ))}
          {unexpected.map((v) => (
            <VaryingRow key={v.key} varying={v} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Runs audited
        </h2>
        <div className="flex flex-wrap gap-2">
          {audit.runs.map((run) => (
            <span
              key={run.name}
              className="rounded-lg border border-white/10 bg-[#0d1122] px-3 py-2 font-mono text-xs text-slate-300"
            >
              {run.name}
              {run.rho !== null && (
                <span className="ml-2 text-slate-500">ρ={run.rho.toFixed(2)}</span>
              )}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Read from each run&apos;s <code className="rounded bg-white/5 px-1.5 py-0.5">args.yaml</code>, written
          by Ultralytics at training time — not from anything transcribed by hand.
        </p>
      </section>
    </>
  );
}

function GroupCard({ group }: Readonly<{ group: AuditGroup }>) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        group.held ? "border-white/10 bg-[#0d1122]" : "border-red-500/30 bg-red-500/[0.06]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-100">{group.label}</h3>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            group.held
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {group.held ? "Held" : "Drifted"}
        </span>
      </div>
      <dl className="mt-4 space-y-1.5">
        {group.keys.map((k) => (
          <div key={k.key} className="flex items-baseline justify-between gap-3 text-xs">
            <dt className="font-mono text-slate-500">{k.key}</dt>
            <dd
              className={`shrink-0 font-mono tabular-nums ${
                k.held ? "text-slate-300" : "text-red-400"
              }`}
            >
              {k.held ? k.value : "varies"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function VaryingRow({ varying }: Readonly<{ varying: AuditVarying }>) {
  return (
    <details
      className={`rounded-2xl border px-5 py-4 ${
        varying.expected ? "border-white/10 bg-[#0d1122]" : "border-red-500/30 bg-red-500/[0.06]"
      }`}
    >
      <summary className="flex cursor-pointer flex-wrap items-center gap-3">
        <code className="font-mono text-sm text-slate-100">{varying.key}</code>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            varying.expected
              ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {varying.expected ? "Permitted" : "Unexpected"}
        </span>
        {varying.reason && <span className="text-xs text-slate-500">{varying.reason}</span>}
      </summary>
      <dl className="mt-4 space-y-1 border-t border-white/5 pt-3">
        {Object.entries(varying.values).map(([run, value]) => (
          <div key={run} className="flex flex-wrap items-baseline gap-x-3 text-xs">
            <dt className="w-40 shrink-0 font-mono text-slate-400">{run}</dt>
            <dd className="break-all font-mono text-slate-500">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
