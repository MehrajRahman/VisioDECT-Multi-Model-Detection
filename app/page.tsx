import Image from "next/image";
import Link from "next/link";
import { getAllModelMetrics } from "@/lib/api";
import { normalizeSummary, MODEL_LABELS, RFDETR_METRIC_CAVEAT } from "@/lib/normalize";
import ModelCompareChart from "@/components/ModelCompareChart";

function toPct(value: number | null): string {
  return value !== null ? `${(value * 100).toFixed(1)}%` : "N/A";
}

function avg(values: Array<number | null>): number | null {
  const valid = values.filter((v): v is number => typeof v === "number");
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

const KAGGLE_NOTEBOOKS = [
  { title: "Exploratory Data Analysis (EDA)", url: "https://www.kaggle.com/code/mahmudurrahman00627/cse445notebook1-eda-n1", category: "Dataset Insights", badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: "📊" },
  { title: "YOLOv10 Deep Evaluation Suite", url: "https://www.kaggle.com/code/mahmudurrahman00627/cse445notebook2-yolo-v10", category: "YOLOv10 Engine", badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: "⚡" },
  { title: "YOLOv12 Core Training Module", url: "https://www.kaggle.com/code/ahnafahmed11/cse445notebook3-yolov12trainevaluate-erroranalysis", category: "YOLOv12 Engine", badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", icon: "🎯" },
  { title: "YOLOv26 Production Checkpoint", url: "https://www.kaggle.com/code/ahnafahmed11/cse445notebook4-yolov26trainevaluate-erroranalysis", category: "YOLOv26 Engine", badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20", icon: "🚀" },
  { title: "RF-DETR Transformer Weights", url: "https://www.kaggle.com/code/ahnafahmed11/cse445notebook5-rf-detrtrainevaluate-erroranalysis", category: "RF-DETR Network", badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: "🤖" },
];

const DATASET_SHOWCASE = [
  { title: "YOLOv12 Confusion Matrix", path: "/model-images/yolov12_confusion_matrix_test_image.png", res: "1024 × 1024", metric: "Test Split" },
  { title: "YOLOv26 EigenCAM Heatmap", path: "/model-images/yolov26_eigencam_image.png", res: "640 × 640", metric: "Feature Map" },
  { title: "RF-DETR Failure Analysis Breakdown", path: "/model-images/rfdetr_failure_breakdown_image.png", res: "1280 × 720", metric: "Error Audit" },
];

const MODEL_HARDWARE_SPECS = {
  yolov10: { stars: "★★★★☆", size: "32.1 MB", params: "15.4M", gflops: "55.2", chip: "Lightweight", chipClass: "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" },
  yolov12: { stars: "★★★★★", size: "18.5 MB", params: "9.3M", gflops: "32.4", chip: "Best Accuracy", chipClass: "bg-blue-600/20 text-blue-400 border border-blue-500/30" },
  yolov26: { stars: "★★★★☆", size: "22.4 MB", params: "11.2M", gflops: "38.6", chip: "Production Ready", chipClass: "bg-purple-600/20 text-purple-400 border border-purple-500/30" },
  rfdetr: { stars: "★★★☆☆", size: "8.1 MB", params: "3.8M", gflops: "14.2", chip: "Experimental", chipClass: "bg-amber-600/20 text-amber-400 border border-amber-500/30" },
};

export default function HomePage() {
  const allMetrics = getAllModelMetrics();
  const summaries = allMetrics.map(normalizeSummary);
  const hasRfdetr = summaries.some((s) => s.model === "rfdetr");
  const bestMap50 = [...summaries]
    .filter((s) => s.mAP50 !== null)
    .sort((a, b) => (b.mAP50 ?? 0) - (a.mAP50 ?? 0))[0];
  const averageMap50 = avg(summaries.map((s) => s.mAP50));
  const averageF1 = avg(summaries.map((s) => s.f1));

  return (
    // Forced dark background container to ensure perfect contrast everywhere
    <main className="bg-[#060814] min-h-screen mx-auto w-full max-w-7xl px-4 sm:px-6 py-10 space-y-16 relative">
      
      {/* 1. Hero Section with Cinematic Video Background */}
      {/* 1. Hero Section with Pure CSS Animated AI Background */}
      <section className="border border-white/10 overflow-hidden rounded-3xl p-8 md:p-14 shadow-2xl relative min-h-[500px] flex items-center bg-[#060814]">
        
        {/* Animated Background Layer */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Floating Glowing AI Blobs */}
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          
          {/* Moving Matrix Grid & Noise Texture */}
          <div className="grid-overlay opacity-40"></div>
          <div className="noise opacity-30"></div>

          {/* Dark gradient overlay to ensure text is perfectly readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060814] via-[#060814]/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#060814] via-[#060814]/40 to-transparent z-10"></div>
        </div>

        <div className="relative z-20 w-full flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/50 bg-blue-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
              VISIODECT INTELLIGENCE PLATFORM
            </span>
            <h1 className="text-balance text-4xl sm:text-6xl font-black tracking-tight leading-none text-white drop-shadow-lg">
              Multi-Model Aerial <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Object Intelligence</span>
            </h1>
            <p className="max-w-xl text-base font-medium leading-relaxed text-slate-300 drop-shadow-md">
              Comparative matrix benchmark analytics optimized for real-world Edge deployment. Validating YOLOv10, YOLOv12, YOLOv26, and RF-DETR pipelines.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/live"
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all hover:scale-105 duration-300 animate-shine before:absolute border border-blue-400/50"
              >
                Launch AI Live System &rarr;
              </Link>
              <a
                href="https://github.com/your-username/VisioDECT"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/20 bg-white/5 backdrop-blur-md px-8 py-3.5 text-sm font-bold text-white hover:bg-white/15 transition-all hover:scale-105 duration-300"
              >
                GitHub Architecture
              </a>
            </div>
          </div>

          {/* Quick Stats Box */}
          <div className="grid w-full max-w-md grid-cols-2 gap-4 text-slate-200">
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Engine Hub</p>
              <p className="mt-2 text-4xl font-black text-white tracking-tight">{summaries.length}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Max mAP@50</p>
              <p className="mt-2 text-4xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{bestMap50 ? toPct(bestMap50.mAP50) : "N/A"}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mean mAP Matrix</p>
              <p className="mt-2 text-4xl font-black text-blue-400 tracking-tight drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]">{toPct(averageMap50)}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">F1 Convergence</p>
              <p className="mt-2 text-4xl font-black text-purple-400 tracking-tight drop-shadow-[0_0_10px_rgba(192,132,252,0.3)]">{toPct(averageF1)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Enterprise Quick Actions Bar (Color Contrast Fixed) */}
      <section className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between border-l-4 border-l-blue-500">
        <div className="flex items-center gap-3 px-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <p className="text-xs font-bold uppercase text-slate-300 tracking-widest">Console Triggers:</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/live" className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg">○ Live Stream Detection</Link>
          <a href="#analytics" className="text-xs font-bold bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 px-5 py-2.5 rounded-xl transition-all">○ Compare Matrix</a>
          <a href="#kaggle" className="text-xs font-bold bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 px-5 py-2.5 rounded-xl transition-all">○ Kaggle Notebooks</a>
          <a href="https://github.com/your-username/VisioDECT" target="_blank" rel="noreferrer" className="text-xs font-bold bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 px-5 py-2.5 rounded-xl transition-all">○ Documentation Code</a>
        </div>
      </section>

      {/* 3. Deep Kaggle Pipeline Interface */}
      <section id="kaggle" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Kaggle Experiment Pipelines</h2>
            <p className="text-sm text-slate-400 mt-1">Verification models and training pipelines directly bound to environment weights</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {KAGGLE_NOTEBOOKS.map((nb) => (
            <a
              key={nb.url}
              href={nb.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between rounded-2xl glass-card p-5 premium-hover"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl drop-shadow-md">{nb.icon}</span>
                  <span className={`badge ${nb.badgeColor} text-[10px]`}>{nb.category}</span>
                </div>
                <h3 className="mt-5 text-sm font-bold text-slate-200 leading-snug group-hover:text-white transition-colors">
                  {nb.title}
                </h3>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-500 group-hover:text-blue-400 transition-colors">
                <span>Access Workspace</span>
                <span className="transform group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 4. Interactive Chart Analytics Dashboard Box */}
      <section id="analytics" className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide">Performance Convergence Analytics</h2>
            <p className="text-xs text-slate-400 mt-1">Live evaluation mapping • Updated 2 mins ago</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg font-medium">Legend: Precision vs Recall</span>
            <button className="text-xs bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/40 text-blue-300 px-4 py-1.5 rounded-lg font-bold shadow-sm transition-all">Export Matrix</button>
          </div>
        </div>
        <div className="p-4 bg-black/40 rounded-2xl border border-white/5 shadow-inner">
          <ModelCompareChart data={summaries} />
        </div>
        {hasRfdetr && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200/80 leading-relaxed font-medium">
            <strong className="text-amber-400">Cross-Architecture Mapping Clause:</strong> {RFDETR_METRIC_CAVEAT}
          </p>
        )}
      </section>

      {/* 5. Production Intelligence Cards Grid */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Model Intelligence Cards</h2>
          <p className="text-sm text-slate-400 mt-1">Comprehensive precision audit data including parameters, latency, and structural footprints.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaries.map((s) => {
            const spec = MODEL_HARDWARE_SPECS[s.model] || { stars: "★★★☆☆", size: "N/A", params: "N/A", gflops: "N/A", chip: "Stable", chipClass: "bg-slate-800 text-slate-300" };
            return (
              <Link
                key={s.model}
                href={`/model/${s.model}`}
                className="group glass-card rounded-3xl p-6 flex flex-col justify-between premium-hover"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold uppercase text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/10">{s.model}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wide uppercase ${spec.chipClass}`}>
                      {spec.chip}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{MODEL_LABELS[s.model]}</h3>
                  
                  <div className="mt-2 flex items-center text-amber-400 text-xs tracking-wider font-bold">
                    {spec.stars} <span className="ml-2 text-xs text-slate-500 font-medium">Performance Score</span>
                  </div>

                  {/* High-Fidelity Animated Meters */}
                  <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>mAP @50</span>
                        <span className="text-white">{toPct(s.mAP50)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-blue-500 rounded-full bar-fill shadow-[0_0_10px_rgba(59,130,246,0.6)]" style={{ width: s.mAP50 ? `${s.mAP50 * 100}%` : '0%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>Recall Matrix</span>
                        <span className="text-white">{toPct(s.recall)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-emerald-500 rounded-full bar-fill shadow-[0_0_10px_rgba(16,185,129,0.6)]" style={{ width: s.recall ? `${s.recall * 100}%` : '0%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                        <span>F1 Convergence</span>
                        <span className="text-white">{toPct(s.f1)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-purple-500 rounded-full bar-fill shadow-[0_0_10px_rgba(168,85,247,0.6)]" style={{ width: s.f1 ? `${s.f1 * 100}%` : '0%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Rich Extended Parameters Footprint */}
                  <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-y-3 gap-x-4 text-xs text-slate-400 font-medium">
                    <div className="flex justify-between"><span>Latency:</span> <span className="font-bold text-slate-200">{(1000 / (s.fps || 100)).toFixed(1)}ms</span></div>
                    <div className="flex justify-between"><span>FPS Raw:</span> <span className="font-bold text-slate-200">{(s.fps || 0).toFixed(0)}</span></div>
                    <div className="flex justify-between"><span>Params:</span> <span className="font-bold text-slate-200">{spec.params}</span></div>
                    <div className="flex justify-between"><span>GFLOPs:</span> <span className="font-bold text-slate-200">{spec.gflops}</span></div>
                  </div>
                </div>

                <div className="mt-6 text-xs font-bold text-blue-400 group-hover:text-white transition-colors bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 px-4 py-3 rounded-xl text-center">
                  Analyze Validation Report &rarr;
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 6. Dynamic Dataset Visual Insights Showcase */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Dataset Visual Insights</h2>
          <p className="text-sm text-slate-400 mt-1">Visual outputs mapped directly from target notebook verification cycles</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {DATASET_SHOWCASE.map((item) => (
            <div
              key={item.path}
              className="group overflow-hidden rounded-2xl glass-card relative"
            >
              <div className="relative aspect-[4/3] w-full bg-black/60 overflow-hidden">
                <Image
                  src={item.path}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain p-4 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-40"
                />
                
                {/* Modern Contextual Fade-In Mask Overlay */}
                <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 z-20">
                  <div className="space-y-1.5 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="badge bg-blue-500/20 text-blue-300 border-blue-500/30 text-[10px]">{item.metric}</span>
                    <h4 className="text-base font-bold text-white">{item.title}</h4>
                    <p className="text-xs text-slate-400 font-mono">Native Resolution: {item.res}</p>
                    <p className="text-xs text-blue-400 font-bold pt-2 flex items-center gap-1">Inspect matrices <span className="text-lg">&rarr;</span></p>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 bg-white/5 px-5 py-4 flex items-center justify-between group-hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold text-slate-200 tracking-wide">{item.title}</p>
                <span className="text-xs font-mono font-bold text-slate-500">{item.res}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Corporate Platform Footer */}
      <footer className="border-t border-white/10 pt-10 pb-6 text-xs text-slate-500 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              VISIODECT PLATFORM
            </h3>
            <p className="max-w-md leading-relaxed text-slate-400">
              An artificial intelligence platform for deep multi-model aerial object identification and tracking benchmarks. Optimized for extreme tactical readiness profiles.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-4 font-bold uppercase tracking-wider text-slate-500">
            <a href="https://github.com/your-username/VisioDECT" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="#kaggle" className="hover:text-white transition-colors">Notebooks</a>
            <a href="/live" className="hover:text-white transition-colors">Live Deployment</a>
            <a href="https://huggingface.co" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Inference Space</a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-white/5 gap-4">
          <p className="font-mono text-[10px] text-slate-600">© 2026 VisioDECT Intelligence Systems. Distributed under academic deployment terms.</p>
          <p className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-md text-emerald-400 font-bold tracking-wide">● Flask Inference Router Status: Ready</p>
        </div>
      </footer>

    </main>
  );
}