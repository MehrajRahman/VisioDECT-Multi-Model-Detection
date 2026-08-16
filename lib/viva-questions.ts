// The viva questions exactly as printed in the Part B assignment brief,
// grouped by notebook. Deliberately NOT answered here: the viva assesses
// individual understanding, and a page of memorisable prose would undercut
// that. What each entry carries instead is (a) where on this dashboard the
// supporting evidence lives, and (b) what the answer has to engage with --
// so preparation starts from your own measured results rather than a
// generic recollection of the paper.

export interface VivaQuestion {
  q: string;
  /** Dashboard page holding the evidence for this answer. */
  evidence?: { href: string; label: string };
  /** What the answer must engage with. Not the answer. */
  prompt?: string;
}

export interface VivaSection {
  notebook: string;
  title: string;
  questions: VivaQuestion[];
}

export const VIVA_SECTIONS: VivaSection[] = [
  {
    notebook: "1a / 1b",
    title: "SimCLR",
    questions: [
      {
        q: "Why does SimCLR require negative pairs while BYOL does not? What failure mode do negatives prevent?",
        prompt: "Name the failure mode explicitly, and say what BYOL substitutes for negatives.",
      },
      {
        q: "Derive the role of the temperature parameter τ in the NT-Xent loss. What happens at very small τ?",
        prompt: "Be ready to reason about the gradient's sensitivity to hard negatives as τ shrinks.",
      },
      {
        q: "Why is the projection head discarded after pretraining instead of transferred to the detector?",
        prompt: "Connect to which layer's representation is actually more transferable, and why.",
      },
      {
        q: "Your batch size on a T4 is far smaller than in the original paper. How does this affect the contrastive objective, and what did you do about it?",
        evidence: { href: "/protocol", label: "batch = 16, held across all runs" },
        prompt: "Your fine-tuning batch is 16 for every run — state the SSL pretraining batch separately and what you traded.",
      },
      {
        q: "Which augmentations matter most for SimCLR on your dataset's imagery, and which could be harmful for later detection fine-tuning?",
        prompt: "Drones are small targets; aggressive cropping is the obvious risk to argue about.",
      },
      {
        q: "How did your t-SNE/retrieval diagnostics change between an early and a final checkpoint?",
        evidence: { href: "/methodology", label: "Pretraining diagnostics" },
        prompt: "Needs the 1a outputs — not yet extracted to the dashboard.",
      },
    ],
  },
  {
    notebook: "2a / 2b",
    title: "BYOL",
    questions: [
      {
        q: "Explain the roles of the online network, target network, and predictor. Why is the predictor essential?",
        prompt: "The asymmetry is the whole answer — say what breaks without it.",
      },
      {
        q: "What is the EMA update rule for the target network, and how does the momentum coefficient affect training stability?",
      },
      {
        q: "Why does BYOL not collapse to a constant representation despite having no negative pairs?",
      },
      {
        q: "Compare BYOL's compute and memory footprint to SimCLR's on your Kaggle runs.",
        evidence: { href: "/ssl", label: "Training minutes per run" },
      },
      {
        q: "Which loss is minimised in BYOL, and between which quantities exactly?",
      },
      {
        q: "Did BYOL or SimCLR produce a better backbone for detection at 20% labels in your experiments — and can you explain why mechanistically?",
        evidence: { href: "/ssl", label: "BYOL 60.64% vs SimCLR 60.41%" },
        prompt:
          "The gap is 0.23 pp — smaller than you can safely attribute to mechanism. Saying so is a stronger answer than inventing a cause.",
      },
    ],
  },
  {
    notebook: "3a / 3b",
    title: "I-JEPA",
    questions: [
      {
        q: "What does it mean that I-JEPA predicts in representation space rather than pixel space? Why is this preferable to a masked autoencoder for semantics?",
      },
      {
        q: "How are context and target blocks sampled, and why must target blocks be masked out of the context?",
      },
      {
        q: "Why does I-JEPA avoid hand-crafted augmentations, and what replaces the invariance signal they normally provide?",
      },
      {
        q: "Which integration route (ViT adapter vs. distillation into the CNN) did you choose, and what trade-off drove the choice?",
        prompt: "The brief requires you to state which route you used and why. Have the answer ready verbatim.",
      },
      {
        q: "How did you map ViT patch tokens to multi-scale P3/P4/P5 features?",
      },
      {
        q: "What evidence in your diagnostics suggests I-JEPA learned spatially localised features useful for detection?",
        evidence: { href: "/ssl", label: "I-JEPA is the top SSL method at 60.85%" },
        prompt: "You can argue this from the downstream result even without the 3a diagnostics.",
      },
    ],
  },
  {
    notebook: "4a / 4b",
    title: "DINOv3",
    questions: [
      {
        q: "What problem in dense (patch-level) features does DINOv3's Gram anchoring address, and why does it matter for detection?",
      },
      {
        q: "Explain the student–teacher self-distillation setup and the multi-crop strategy.",
      },
      {
        q: "You continued pretraining from released weights: what distinguishes domain-adaptive pretraining from training from scratch, and how does it change the fairness of comparison with SimCLR/BYOL/I-JEPA?",
        evidence: { href: "/ssl", label: "The DINOv3 caveat, shown beside the chart" },
        prompt:
          "This is the most likely question you will be asked. The dashboard already states the caveat — make sure your answer matches it.",
      },
      {
        q: "How do frozen DINOv3 features compare with fine-tuned ones in your downstream runs?",
      },
      {
        q: "Why are ViT-based foundation backbones often more label-efficient than CNNs pretrained from scratch?",
        evidence: { href: "/label-efficiency", label: "The DINOv3 curve, ρ = 0.10 → 0.50" },
      },
      {
        q: "If you could only ship one SSL backbone to an edge device in your problem's deployment setting, which would you pick and why (accuracy, latency, memory)?",
        evidence: { href: "/ssl", label: "All four SSL methods within 0.44 pp" },
        prompt:
          "Since accuracy barely separates them, the honest answer pivots on latency and memory — not on the mAP ranking.",
      },
    ],
  },
  {
    notebook: "5",
    title: "Tracking",
    questions: [
      {
        q: "Explain the tracking-by-detection paradigm. Why does tracker quality depend so strongly on detector mAP?",
        evidence: { href: "/tracking", label: "Mean detection confidence ≈ 0.61" },
      },
      {
        q: "How does ByteTrack use low-confidence detections, and why does this reduce ID switches?",
        evidence: { href: "/tracking", label: "track_conf = 0.08" },
        prompt: "Your association threshold is unusually low — be ready to justify that number.",
      },
      {
        q: "Define MOTA and IDF1. Which failure types does each punish, and why can a tracker have high MOTA but low IDF1?",
        prompt:
          "You reported proxy metrics rather than MOTA/IDF1 because you had no ground truth. Say that, then define both anyway.",
      },
      {
        q: "What association cues does BoT-SORT add over ByteTrack, and when do they matter?",
        evidence: { href: "/tracking", label: "ReID: 13 IDs vs ByteTrack's 7" },
        prompt:
          "Your strongest result: the added cue actively hurt here. Explain when it would have helped instead.",
      },
      {
        q: "What domain gap did you observe between your training images and the video, and how did it show up in the tracks?",
        evidence: { href: "/tracking", label: "21–25 gap events per run" },
      },
      {
        q: "If your video was AI-generated or synthetic: what are the risks of evaluating on synthetic footage, and how did you mitigate them in your conclusions?",
      },
    ],
  },
  {
    notebook: "Bonus",
    title: "Label-efficiency ablation",
    questions: [
      {
        q: "Why must the label subsets be nested and seeded? What bias appears if each fraction is sampled independently?",
        evidence: { href: "/protocol", label: "seed = 445, held across all 10 runs" },
      },
      {
        q: "Why is the validation/test split kept at 100% while the training labels are reduced?",
        evidence: { href: "/methodology", label: "2,060 val / 2,060 test, fixed" },
      },
      {
        q: "Where is the gap between SSL and supervised initialisation largest — low or high ρ — and what does theory predict?",
        evidence: { href: "/label-efficiency", label: "The two curves" },
        prompt:
          "You only have COCO at ρ = 0.20, so the honest answer is that you cannot yet measure how the gap moves with ρ.",
      },
      {
        q: "Your curve at some fraction may be non-monotonic. Give two legitimate experimental explanations.",
        evidence: { href: "/label-efficiency", label: "Your DINOv3 curve is monotonic" },
        prompt: "Answer the general question, then note that yours happens to be monotonic throughout.",
      },
      {
        q: "What is your break-even ρ, and what does it imply about annotation cost savings for a real deployment?",
        evidence: { href: "/label-efficiency", label: "Break-even cards" },
        prompt:
          "Neither break-even is reached with current data. The saturation knee above ρ = 0.30 is the finding you do have.",
      },
      {
        q: "If you extended the sweep to 1% labels, what would you expect to happen to each curve and why?",
        evidence: { href: "/label-efficiency", label: "ρ = 0.10 → 58.76%" },
      },
    ],
  },
];
