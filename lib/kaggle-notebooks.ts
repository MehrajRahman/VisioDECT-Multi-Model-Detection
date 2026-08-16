// The full notebook inventory for the assignment, in the order the brief
// lists it. This is the single source of truth -- the home page's pipeline
// section and the /notebooks submission checklist both read from here.
//
// FILLING IN PART B URLS: paste each notebook's public Kaggle URL into `url`
// below. Anything left null renders as "URL needed" on /notebooks rather than
// silently disappearing, because the submission checklist requires a public
// link for every core notebook. Notebook *names* recovered from the run
// outputs are matched in automatically (see lib/partb.ts getNotebookEvidence)
// and shown as evidence the notebook ran -- but a declared name is not a URL,
// and is never turned into a guessed link.

export type NotebookPart = "A" | "B" | "ablation";

export interface NotebookEntry {
  /** Brief's numbering: "1a", "3b", "5", "B". */
  no: string;
  part: NotebookPart;
  title: string;
  /** What the brief says this notebook must contain. */
  content: string;
  /** Public Kaggle URL. null = still needs pasting in. */
  url: string | null;
  /** The `notebook` string this run stamps on its own JSON outputs, if known. */
  declaredAs?: string;
  /** Marks notebooks outside the brief's required 9-core inventory. */
  optional?: boolean;
  /** For ablation notebooks: the cell id used in partb_ssl_ablation.json. */
  cell?: string;
}

export const NOTEBOOKS: NotebookEntry[] = [
  // ---- Part A: five notebooks, all published ----
  {
    no: "A1", part: "A", title: "EDA & Preprocessing",
    content: "Dataset statistics, class balance, lighting scenarios.",
    url: "https://www.kaggle.com/code/mahmudurrahman00627/cse445notebook1-eda-n1",
  },
  {
    no: "A2", part: "A", title: "YOLOv10-m",
    content: "Train, evaluate, error analysis.",
    url: "https://www.kaggle.com/code/mahmudurrahman00627/cse445notebook2-yolo-v10",
  },
  {
    no: "A3", part: "A", title: "YOLOv12-s",
    content: "Train, evaluate, error analysis.",
    url: "https://www.kaggle.com/code/ahnafahmed11/cse445notebook3-yolov12trainevaluate-erroranalysis",
  },
  {
    no: "A4", part: "A", title: "YOLOv26-s",
    content: "Train, evaluate, error analysis. Winning architecture, carried into Part B.",
    url: "https://www.kaggle.com/code/ahnafahmed11/cse445notebook4-yolov26trainevaluate-erroranalysis",
  },
  {
    no: "A5", part: "A", title: "RF-DETR Nano",
    content: "Train, evaluate, error analysis. Excluded from Part B by the brief.",
    url: "https://www.kaggle.com/code/ahnafahmed11/cse445notebook5-rf-detrtrainevaluate-erroranalysis",
  },

  // ---- Part B: nine core notebooks + bonus ----
  {
    no: "1a", part: "B", title: "SimCLR pretraining",
    content: "Contrastive pretraining on the unlabelled pool, plus t-SNE and retrieval diagnostics.",
    url:
      "https://www.kaggle.com/code/mahmudurrahman00627/grouph-partb-01a-simclr-pretrain",
  },
  {
    no: "1b", part: "B", title: "SimCLR → YOLO @ 20%",
    content: "Weight surgery and fine-tuning at ρ = 0.20.",
    url:
      "https://www.kaggle.com/code/mahmudurrahman00627/grouph-partb-01b-simclr-detectv2", declaredAs: "partB-01b-simclr-detect",
  },
  {
    no: "2a", part: "B", title: "BYOL pretraining",
    content: "Negative-free self-distillation, plus diagnostics.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook2a-byol-self-supervisedpretraining",
  },
  {
    no: "2b", part: "B", title: "BYOL → YOLO @ 20%",
    content: "Weight surgery and fine-tuning at ρ = 0.20.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook2b-byol-self-superviseddownstream",
    declaredAs: "partB-02b-byol-detect",
  },
  {
    no: "3a", part: "B", title: "I-JEPA pretraining",
    content: "Latent-space masked prediction, plus diagnostics.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook3a-i-jepa-self-supervisedpretraining",
  },
  {
    no: "3b", part: "B", title: "I-JEPA → YOLO @ 20%",
    content: "Fine-tuning at ρ = 0.20, plus the shared random-init and COCO baselines.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook3b-i-jepa-self-superviseddownstream", declaredAs: "partB-03b-ijepa-detect",
  },
  {
    no: "4a", part: "B", title: "DINOv3 domain-adaptive pretraining",
    content: "Continued self-supervised adaptation from released weights, plus diagnostics.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook4a-dinov3-self-supervisedpretraining",
  },
  {
    no: "4b", part: "B", title: "DINOv3 → YOLO @ 20%",
    content: "Weight surgery and fine-tuning at ρ = 0.20.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook4b-dinov3-self-superviseddownstream", declaredAs: "partB-04b-dinov3-detect",
  },
  {
    no: "5", part: "B", title: "Tracking",
    content: "ByteTrack and BoT-SORT over the 20%-label detector, with proxy MOT metrics.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebook5-downstreamtracking-self-supervised", declaredAs: "partB-05-tracking",
  },
  {
    no: "B", part: "B", title: "Label-efficiency ablation", optional: true,
    content: "The 10–50% grid, best SSL against the COCO baseline, with the headline curve.",
    url:
      "https://www.kaggle.com/code/ahnafahmed11/partb-notebookbonus-labelefficiency-selfsupervised",
  },

  // ---- Pretraining hyperparameter ablation: six extra notebooks ----
  // Outside the brief's required inventory, so they do not count toward
  // CORE_COUNT, but they back the /ssl-ablation page.
  {
    no: "AB1", part: "ablation", title: "Pretraining ablation 1", optional: true, cell: "ab1",
    content: "One SSL pretraining recipe (lr / weight decay / EMA), then fine-tune at ρ = 0.20.",
    url: "https://www.kaggle.com/code/mdtamimhasansaykat/ablation-1-complete-code",
  },
  {
    no: "AB2", part: "ablation", title: "Pretraining ablation 2", optional: true, cell: "ab2",
    content: "One SSL pretraining recipe (lr / weight decay / EMA), then fine-tune at ρ = 0.20.",
    url: "https://www.kaggle.com/code/tamimsaykat11119/ablation-2-complete-code",
  },
  {
    no: "AB3", part: "ablation", title: "Pretraining ablation 3", optional: true, cell: "ab3",
    content: "One SSL pretraining recipe (lr / weight decay / EMA), then fine-tune at ρ = 0.20.",
    url: "https://www.kaggle.com/code/tamimsaykat/ablation-3-complete-code",
  },
  {
    no: "AB4", part: "ablation", title: "Pretraining ablation 4", optional: true, cell: "ab4",
    content: "One SSL pretraining recipe (lr / weight decay / EMA), then fine-tune at ρ = 0.20.",
    url: "https://www.kaggle.com/code/mdtamimhasansaykat/ablation-4-complete-code",
  },
  {
    no: "AB5", part: "ablation", title: "Pretraining ablation 5", optional: true, cell: "ab5",
    content: "One SSL pretraining recipe (lr / weight decay / EMA), then fine-tune at ρ = 0.20.",
    url: "https://www.kaggle.com/code/tamimsaykat11119/ablation-5-complete-code",
  },
  {
    no: "AB6", part: "ablation", title: "Pretraining ablation 6", optional: true, cell: "ab6",
    content: "One SSL pretraining recipe (lr / weight decay / EMA), then fine-tune at ρ = 0.20.",
    url: "https://www.kaggle.com/code/tamimsaykat/ablation-6-complete-code",
  },
];

/** Core notebooks the submission checklist requires a public link for. */
export const CORE_COUNT = NOTEBOOKS.filter((n) => !n.optional).length;
