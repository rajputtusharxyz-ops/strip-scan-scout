import { ANALYSIS_STATUSES, type AnalysisResponse, type CompleteAnalysis } from "@/types/analysis";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export function failure(status: Exclude<AnalysisResponse["status"], "complete">, errorCode: string, message: string): AnalysisResponse {
  return {
    status, albuminMgL: null, creatinineMgL: null, acr: null,
    detectionConfidence: { albumin: null, creatinine: null },
    capturedAt: new Date().toISOString(), analysisBuild: null, errorCode, message,
  };
}

/**
 * Validates an untrusted service response. Any "complete" response that lacks a
 * usable albumin, a positive creatinine or an ACR is downgraded to "error" so
 * partial or impossible numbers are never shown.
 */
export function normalizeResponse(raw: unknown): AnalysisResponse {
  if (!raw || typeof raw !== "object") return failure("error", "bad_response", "The analysis service returned an unreadable response.");
  const r = raw as Record<string, unknown>;
  const status = ANALYSIS_STATUSES.includes(r.status as never) ? (r.status as AnalysisResponse["status"]) : null;
  if (!status) return failure("error", "bad_response", "The analysis service returned an unknown status.");
  const dc = (r.detectionConfidence ?? {}) as Record<string, unknown>;
  const base: AnalysisResponse = {
    status,
    albuminMgL: null, creatinineMgL: null, acr: null,
    detectionConfidence: { albumin: isNum(dc.albumin) ? dc.albumin : null, creatinine: isNum(dc.creatinine) ? dc.creatinine : null },
    capturedAt: typeof r.capturedAt === "string" ? r.capturedAt : new Date().toISOString(),
    analysisBuild: typeof r.analysisBuild === "string" ? r.analysisBuild : null,
    errorCode: typeof r.errorCode === "string" ? r.errorCode : null,
    message: typeof r.message === "string" ? r.message : null,
  };
  if (status !== "complete") return base; // never carry numbers on a non-complete result
  const { albuminMgL: al, creatinineMgL: cr, acr } = r;
  if (!isNum(al) || al < 0) return { ...base, status: "error", errorCode: "invalid_albumin", message: "The albumin estimate was not valid." };
  if (!isNum(cr) || cr <= 0) return { ...base, status: "error", errorCode: "invalid_creatinine", message: "The creatinine estimate was zero or below, so a ratio cannot be calculated." };
  if (!isNum(acr)) return { ...base, status: "error", errorCode: "invalid_acr", message: "The ratio could not be calculated." };
  return { ...base, albuminMgL: al, creatinineMgL: cr, acr };
}

export const isComplete = (a: AnalysisResponse): a is CompleteAnalysis => a.status === "complete";

export function analysisServiceUrl(): string | undefined {
  const u = import.meta.env.VITE_ANALYSIS_API_URL as string | undefined;
  return u ? u.replace(/\/$/, "") : undefined;
}

async function dataUrlToBlob(dataUrl: string) {
  return (await fetch(dataUrl)).blob();
}

/** Sends one image to the fixed inference service. Never fabricates a result. */
export async function analyzeImage(image: string, fetchImpl: typeof fetch = fetch, baseUrl = analysisServiceUrl()): Promise<AnalysisResponse> {
  if (!baseUrl) return failure("analysis_unavailable", "not_configured", "The analysis service is not connected yet.");
  let res: Response;
  try {
    const blob = await dataUrlToBlob(image);
    const form = new FormData();
    form.append("image", blob, `strip.${blob.type.split("/")[1] || "jpg"}`);
    res = await fetchImpl(`${baseUrl}/api/analyze`, { method: "POST", body: form });
  } catch {
    return failure("analysis_unavailable", "network", "We could not reach the analysis service.");
  }
  if (res.status >= 500 || res.status === 429) return failure("analysis_unavailable", `http_${res.status}`, "The analysis service is busy or unavailable.");
  try {
    return normalizeResponse(await res.json());
  } catch {
    return failure("error", "bad_response", "The analysis service returned an unreadable response.");
  }
}
