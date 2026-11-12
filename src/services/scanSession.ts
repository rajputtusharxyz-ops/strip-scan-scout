/**
 * In-memory scan session. Nothing here is persisted; refresh/close clears it.
 */
import { useSyncExternalStore } from "react";
import type { Bounds, QualityReport, Scan } from "@/types/scan";
import type { PadId } from "@/types/referenceConfig";
import { getPixels, loadImage } from "@/lib/image";
import { detectStrip } from "./stripDetection";
import { assessQuality } from "./imageQuality";
import { analyzeImage } from "./analysisApi";

export type Session = {
  image?: string;
  source?: "camera" | "upload";
  quality?: QualityReport;
  bounds?: Record<PadId, Bounds>;
  result?: Scan | undefined;
};

let session: Session = {};
const listeners = new Set<() => void>();
const set = (s: Session) => { session = s; listeners.forEach((l) => l()); };

export const scanSession = {
  get: () => session,
  reset: () => set({}),
  update: (patch: Partial<Session>) => set({ ...session, ...patch }),
  subscribe: (l: () => void) => { listeners.add(l); return () => listeners.delete(l); },
};

export function useScanSession() {
  return useSyncExternalStore(scanSession.subscribe, scanSession.get, scanSession.get);
}

const ANALYSIS_SIDE = 480;

export async function runQualityCheck(image: string) {
  const img = await loadImage(image);
  if (Math.min(img.naturalWidth, img.naturalHeight) < 200) {
    throw new Error("This image is too small to read. Please use a photo at least 320 pixels wide.");
  }
  const px = getPixels(img, ANALYSIS_SIDE);
  const det = detectStrip(px);
  const quality = assessQuality(px, det);
  const defaults: Record<PadId, Bounds> = {
    "pad-a": det.pads[0] ?? { x: 0.4, y: 0.15, width: 0.2, height: 0.1 },
    "pad-b": det.pads[1] ?? { x: 0.4, y: 0.3, width: 0.2, height: 0.1 },
  };
  return { quality, bounds: defaults };
}

export async function runAnalysis(fetchImpl?: typeof fetch): Promise<Scan> {
  const { image, quality, source } = session;
  if (!image || !quality) throw new Error("No photo to analyse.");
  // Clear any previous result first so stale values can never be shown.
  set({ ...session, result: undefined });
  const analysis = await analyzeImage(image, fetchImpl);
  const scan: Scan = {
    id: crypto.randomUUID(),
    createdAt: analysis.capturedAt,
    source: source ?? "upload",
    image,
    quality: { score: quality.score, label: quality.label, checks: quality.checks },
    analysis,
  };
  set({ ...session, result: scan });
  return scan;
}
