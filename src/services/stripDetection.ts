/**
 * Prototype strip/pad detection — deterministic heuristics, NOT clinical-grade computer vision.
 * Replaceable: keep the same input/output shape when a validated detector is introduced.
 */
import type { Bounds } from "@/types/scan";
import { rgbToHsv, type RGB } from "@/lib/color";

export type PixelData = { data: Uint8ClampedArray; width: number; height: number };

export type Blob = { x0: number; y0: number; x1: number; y1: number; area: number };

export type DetectionResult = {
  status: "ok" | "multiple-strips" | "missing-pads";
  candidateCount: number;
  pads: Bounds[]; // [Pad A, Pad B] when status ok
  orientation: "vertical" | "horizontal";
  backgroundColor: RGB;
  mask: Uint8Array;
};

export function estimateBackground(px: PixelData): RGB {
  const { data, width, height } = px;
  const rs: number[] = [], gs: number[] = [], bs: number[] = [];
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
  };
  const step = Math.max(1, Math.floor(Math.min(width, height) / 60));
  for (let x = 0; x < width; x += step) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y += step) { push(0, y); push(width - 1, y); }
  const med = (a: number[]) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
  return [med(rs), med(gs), med(bs)];
}

export function colouredMask(px: PixelData, bg: RGB): Uint8Array {
  const { data, width, height } = px;
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const { s, v } = rgbToHsv([r, g, b]);
    const diff = Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]);
    if (s > 0.12 && v > 0.2 && diff > 45) mask[i] = 1;
  }
  return mask;
}

export function findBlobs(mask: Uint8Array, width: number, height: number, minArea: number): Blob[] {
  const seen = new Uint8Array(mask.length);
  const blobs: Blob[] = [];
  const stack: number[] = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    let x0 = width, y0 = height, x1 = 0, y1 = 0, area = 0;
    stack.push(start);
    seen[start] = 1;
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width, y = (p - x) / width;
      area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      const n = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1];
      for (const q of n) if (q >= 0 && mask[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
    }
    if (area >= minArea) blobs.push({ x0, y0, x1, y1, area });
  }
  return blobs;
}

export function detectStrip(px: PixelData): DetectionResult {
  const { width, height } = px;
  const bg = estimateBackground(px);
  const mask = colouredMask(px, bg);
  const minArea = Math.max(12, width * height * 0.0015);
  const blobs = findBlobs(mask, width, height, minArea).filter((b) => {
    const boxArea = (b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1);
    const fill = b.area / boxArea;
    const aspect = (b.x1 - b.x0 + 1) / (b.y1 - b.y0 + 1);
    return fill > 0.5 && aspect > 0.25 && aspect < 4;
  });

  const base = { candidateCount: blobs.length, backgroundColor: bg, mask, orientation: "vertical" as const };
  if (blobs.length > 2) return { ...base, status: "multiple-strips", pads: [] };
  if (blobs.length < 2) return { ...base, status: "missing-pads", pads: [] };

  const [p, q] = blobs;
  const cx = (b: Blob) => (b.x0 + b.x1) / 2, cy = (b: Blob) => (b.y0 + b.y1) / 2;
  const vertical = Math.abs(cy(p) - cy(q)) >= Math.abs(cx(p) - cx(q));
  const sorted = [...blobs].sort((a, b) => (vertical ? cy(a) - cy(b) : cx(a) - cx(b)));
  // Pads on one strip should be roughly aligned on the other axis.
  const misalign = vertical ? Math.abs(cx(p) - cx(q)) / width : Math.abs(cy(p) - cy(q)) / height;
  if (misalign > 0.12) return { ...base, status: "multiple-strips", pads: [] };

  const pads = sorted.map((b) => ({
    x: b.x0 / width,
    y: b.y0 / height,
    width: (b.x1 - b.x0 + 1) / width,
    height: (b.y1 - b.y0 + 1) / height,
  }));
  return { ...base, status: "ok", pads, orientation: vertical ? "vertical" : "horizontal" };
}
