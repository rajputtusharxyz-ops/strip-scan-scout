import type { PadId } from "./referenceConfig";
import type { AnalysisResponse } from "./analysis";

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

export type { PadId };

export type Scan = {
  id: string;
  createdAt: string;
  source: "camera" | "upload";
  image?: string;
  quality: { score: number; label: QualityReport["label"]; checks: QualityCheck[] };
  analysis: AnalysisResponse;
  savedConsent?: "result-only" | "result-and-photo";
};
