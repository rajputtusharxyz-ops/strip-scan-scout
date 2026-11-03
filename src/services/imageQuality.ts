/**
 * Prototype photo-quality checks using transparent heuristics. Replaceable service.
 */
import type { QualityCheck, QualityReport, Bounds } from "@/types/scan";
import { rgbToHsv } from "@/lib/color";
import type { DetectionResult, PixelData } from "./stripDetection";

const lum = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function unionBounds(pads: Bounds[], margin: number): Bounds {
  const x0 = Math.max(0, Math.min(...pads.map((p) => p.x)) - margin);
  const y0 = Math.max(0, Math.min(...pads.map((p) => p.y)) - margin);
  const x1 = Math.min(1, Math.max(...pads.map((p) => p.x + p.width)) + margin);
  const y1 = Math.min(1, Math.max(...pads.map((p) => p.y + p.height)) + margin);
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

export function assessQuality(px: PixelData, det: DetectionResult): QualityReport {
  const { data, width, height } = px;
  const gray = new Float32Array(width * height);
  let sumL = 0, bgR = 0, bgB = 0, bgG = 0, bgN = 0;
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const l = lum(r, g, b);
    gray[i] = l * 255;
    sumL += l;
    if (!det.mask[i]) { bgR += r; bgG += g; bgB += b; bgN++; }
  }
  const meanL = sumL / (width * height);
  const cast = bgN ? (bgR - bgB) / bgN / 255 : 0;

  // Shadow: luminance spread across a 4x4 grid of background cells.
  const cells: number[] = [];
  for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
    let s = 0, n = 0;
    for (let y = Math.floor((gy * height) / 4); y < Math.floor(((gy + 1) * height) / 4); y += 2)
      for (let x = Math.floor((gx * width) / 4); x < Math.floor(((gx + 1) * width) / 4); x += 2) {
        const i = y * width + x;
        if (!det.mask[i]) { s += gray[i]; n++; }
      }
    if (n) cells.push(s / n / 255);
  }
  const shadowSpread = cells.length ? Math.max(...cells) - Math.min(...cells) : 0;

  const region = det.pads.length ? unionBounds(det.pads, 0.06) : { x: 0, y: 0, width: 1, height: 1 };
  const rx0 = Math.floor(region.x * width), ry0 = Math.floor(region.y * height);
  const rx1 = Math.ceil((region.x + region.width) * width), ry1 = Math.ceil((region.y + region.height) * height);

  // Sharpness: max edge gradient around pads (sharp edges → large single-pixel steps).
  const grads: number[] = [];
  let busy = 0, outside = 0;
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    const gmag = Math.abs(gray[i + 1] - gray[i - 1]) + Math.abs(gray[i + width] - gray[i - width]);
    const inRegion = x >= rx0 && x <= rx1 && y >= ry0 && y <= ry1;
    if (inRegion) grads.push(gmag);
    else { outside++; if (gmag > 40) busy++; }
  }
  grads.sort((a, b) => b - a);
  const topN = Math.max(1, Math.floor(grads.length * 0.01));
  const sharpness = grads.slice(0, topN).reduce((a, b) => a + b, 0) / topN;
  const clutter = outside ? busy / outside : 0;

  // Glare: near-white, desaturated pixels inside pad boxes.
  let glare = 0, padPx = 0;
  for (const p of det.pads) {
    for (let y = Math.floor(p.y * height); y < Math.ceil((p.y + p.height) * height); y++)
      for (let x = Math.floor(p.x * width); x < Math.ceil((p.x + p.width) * width); x++) {
        const i = (y * width + x) * 4;
        const { s, v } = rgbToHsv([data[i], data[i + 1], data[i + 2]]);
        padPx++;
        if (v > 0.96 && s < 0.08) glare++;
      }
  }
  const glareRatio = padPx ? glare / padPx : 0;

  const checks: QualityCheck[] = [];
  checks.push(
    det.status === "multiple-strips"
      ? { id: "one-strip", label: "One strip found", status: "fail", message: "We found more than one strip, or other coloured objects.", advice: "Photograph one strip by itself. Remove the bottle and colour chart from the frame." }
      : { id: "one-strip", label: "One strip found", status: det.status === "ok" ? "pass" : "warning", message: det.status === "ok" ? "One strip shape detected." : "We could not confirm a single strip." },
  );
  const padsAtEdge = det.pads.some((p) => p.x < 0.01 || p.y < 0.01 || p.x + p.width > 0.99 || p.y + p.height > 0.99);
  checks.push(
    det.status !== "ok"
      ? { id: "pads-visible", label: "Both pads visible", status: "fail", message: "We could not find both test pads clearly.", advice: "Make sure only one strip is in the frame, with the coloured end fully visible and in focus." }
      : padsAtEdge
        ? { id: "pads-visible", label: "Both pads visible", status: "fail", message: "A pad is cut off at the edge of the photo.", advice: "Move the phone back so the whole pad end is inside the frame." }
        : { id: "pads-visible", label: "Both pads visible", status: "pass", message: "Two pad areas found." },
  );
  checks.push(
    sharpness < 45
      ? { id: "focus", label: "Strip is in focus", status: "fail", message: "The pad edges are not sharp enough.", advice: "Rest your phone and take another photo." }
      : sharpness < 70
        ? { id: "focus", label: "Strip is in focus", status: "warning", message: "Focus is acceptable but a little soft." }
        : { id: "focus", label: "Strip is in focus", status: "pass", message: "Pad edges look sharp." },
  );
  let lighting: QualityCheck = { id: "lighting", label: "Lighting is even", status: "pass", message: "Brightness and colour look neutral." };
  if (meanL < 0.35) lighting = { ...lighting, status: "fail", message: "The photo is too dark — pad colours are difficult to distinguish.", advice: "Move to brighter, indirect white light." };
  else if (cast > 0.14) lighting = { ...lighting, status: "fail", message: "This light is too yellow for a reliable comparison.", advice: "Place the strip near indirect daylight or a neutral white light, turn off flash, and try again." };
  else if (cast < -0.14) lighting = { ...lighting, status: "fail", message: "This light is too blue for a reliable comparison.", advice: "Try indirect daylight or a neutral white light." };
  else if (shadowSpread > 0.45) lighting = { ...lighting, status: "fail", message: "A strong shadow falls across the photo.", advice: "Move the phone so it does not block the light, or use more even light." };
  else if (shadowSpread > 0.28 || cast > 0.08) lighting = { ...lighting, status: "warning", message: "Lighting is slightly uneven or warm." };
  checks.push(lighting);
  checks.push(
    glareRatio > 0.12
      ? { id: "glare", label: "No strong glare", status: "fail", message: "Light is reflecting on the pads.", advice: "Tilt the phone slightly or move away from direct light." }
      : { id: "glare", label: "No strong glare", status: glareRatio > 0.05 ? "warning" : "pass", message: glareRatio > 0.05 ? "Some reflection on a pad." : "No strong reflections on the pads." },
  );
  checks.push(
    clutter > 0.15
      ? { id: "background", label: "Background is plain", status: "fail", message: "The background is too busy to read reliably.", advice: "Place the strip on a clean white or light-grey surface." }
      : { id: "background", label: "Background is plain", status: clutter > 0.07 ? "warning" : "pass", message: clutter > 0.07 ? "Background has some texture." : "Background looks plain." },
  );

  const score = Math.round((checks.reduce((a, c) => a + (c.status === "pass" ? 1 : c.status === "warning" ? 0.5 : 0), 0) / checks.length) * 100);
  const passed = checks.every((c) => c.status !== "fail");
  return { score, checks, passed, label: !passed ? "Poor" : score >= 85 ? "Good" : "Fair" };
}
