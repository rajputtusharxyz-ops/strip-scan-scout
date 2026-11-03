import { deltaE2000, hexToRgb, rgbToHex, rgbToHsv, rgbToLab, type RGB } from "@/lib/color";
import type { ReferenceConfiguration, PadId } from "@/types/referenceConfig";
import type { Bounds, PadResult } from "@/types/scan";
import type { PixelData } from "./stripDetection";

export const CONFIDENCE_THRESHOLD = 50;

/** Robust median colour of the central 60% of a pad, excluding glare pixels. */
export function samplePadColor(px: PixelData, b: Bounds): RGB | null {
  const { data, width, height } = px;
  const inset = 0.2;
  const x0 = Math.floor((b.x + b.width * inset) * width), x1 = Math.ceil((b.x + b.width * (1 - inset)) * width);
  const y0 = Math.floor((b.y + b.height * inset) * height), y1 = Math.ceil((b.y + b.height * (1 - inset)) * height);
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  for (let y = Math.max(0, y0); y < Math.min(height, y1); y++)
    for (let x = Math.max(0, x0); x < Math.min(width, x1); x++) {
      const i = (y * width + x) * 4;
      const { s, v } = rgbToHsv([data[i], data[i + 1], data[i + 2]]);
      if (v > 0.96 && s < 0.08) continue;
      rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
    }
  if (!rs.length) return null;
  const med = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
  return [med(rs), med(gs), med(bs)];
}

/** deltaE → plain match percentage (demo mapping, not a clinical accuracy figure). */
export function confidenceFromDeltaE(dE: number): number {
  return Math.max(0, Math.min(99, Math.round(100 - dE * 3)));
}

export function matchPads(px: PixelData, bounds: Record<PadId, Bounds>, config: ReferenceConfiguration): PadResult[] {
  return config.pads.map((pad) => {
    const rgb = samplePadColor(px, bounds[pad.id]);
    if (!rgb) return { id: pad.id, bounds: bounds[pad.id], sampledColor: "#000000" };
    const lab = rgbToLab(rgb);
    let best = pad.levels[0], bestD = Infinity;
    for (const level of pad.levels) {
      const d = deltaE2000(lab, rgbToLab(hexToRgb(level.representativeHex)));
      if (d < bestD) { bestD = d; best = level; }
    }
    const conf = confidenceFromDeltaE(bestD);
    return {
      id: pad.id,
      bounds: bounds[pad.id],
      sampledColor: rgbToHex(rgb),
      matchConfidence: conf,
      resultLevel: conf >= CONFIDENCE_THRESHOLD ? best.id : undefined,
    };
  });
}
