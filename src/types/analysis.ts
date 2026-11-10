/** Contract for POST /api/analyze on the fixed inference service. Keep in sync with inference-service/app/schemas.py. */
export const ANALYSIS_STATUSES = ["complete", "retake_required", "invalid_image", "analysis_unavailable", "error"] as const;
export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];

export type AnalysisResponse = {
  status: AnalysisStatus;
  albuminMgL: number | null;
  creatinineMgL: number | null;
  acr: number | null;
  detectionConfidence: { albumin: number | null; creatinine: number | null };
  capturedAt: string;
  analysisBuild: string | null;
  errorCode: string | null;
  message: string | null;
};

/** A result whose numbers are safe to display. */
export type CompleteAnalysis = AnalysisResponse & { status: "complete"; albuminMgL: number; creatinineMgL: number; acr: number };
