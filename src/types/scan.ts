import type { PadId } from "./referenceConfig";

export type Bounds = { x: number; y: number; width: number; height: number }; // normalized 0–1

export type QualityCheckId = "one-strip" | "pads-visible" | "focus" | "lighting" | "glare" | "background";

export type QualityCheck = {
  id: QualityCheckId;
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
  advice?: string;
};

export type QualityReport = {
  score: number;
  label: "Good" | "Fair" | "Poor";
  checks: QualityCheck[];
  passed: boolean;
};

export type PadResult = {
  id: PadId;
  bounds: Bounds;
  sampledColor: string;
  resultLevel?: string;
  matchConfidence?: number;
};

export type ResultState = "estimate-available" | "needs-better-photo" | "cannot-analyse";

export type Scan = {
  id: string;
  createdAt: string;
  source: "camera" | "upload";
  image?: string;
  quality: { score: number; label: QualityReport["label"]; checks: QualityCheck[] };
  configuration: { id: string; status: "demo" | "validated"; lotNumber?: string };
  pads: PadResult[];
  state: ResultState;
  savedConsent?: "result-only" | "result-and-photo";
};
