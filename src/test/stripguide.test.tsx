import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { detectStrip, type PixelData } from "@/services/stripDetection";
import { assessQuality } from "@/services/imageQuality";
import { demoReferenceConfig } from "@/data/demoReferenceConfig";
import { configurationStatusLabel } from "@/services/referenceConfigService";
import { SafetyNotice } from "@/components/shared/SafetyNotice";
import { DEFAULT_SAVE_CHOICE } from "@/components/results/ConsentSaveDialog";
import { ResultCard } from "@/components/results/ResultCard";
import { localHistory } from "@/services/localHistory";
import type { Scan } from "@/types/scan";

function makePixels(w: number, h: number, rects: Array<[number, number, number, number, [number, number, number]]>, bg: [number, number, number] = [242, 241, 238]): PixelData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = bg[0]; data[i * 4 + 1] = bg[1]; data[i * 4 + 2] = bg[2]; data[i * 4 + 3] = 255; }
  for (const [x, y, rw, rh, c] of rects)
    for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) {
      const i = (yy * w + xx) * 4; data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
    }
  return { data, width: w, height: h };
}

const padA: [number, number, number] = [187, 212, 201];
const padB: [number, number, number] = [230, 220, 156];

describe("image rejection", () => {
  it("passes a clean single strip", () => {
    const px = makePixels(200, 300, [[90, 40, 22, 22, padA], [90, 70, 22, 22, padB]]);
    const q = assessQuality(px, detectStrip(px));
    expect(q.passed).toBe(true);
  });
  it("rejects a photo with several strips", () => {
    const px = makePixels(200, 300, [[30, 40, 22, 22, padA], [30, 70, 22, 22, padB], [140, 40, 22, 22, padA], [140, 70, 22, 22, padB]]);
    const det = detectStrip(px);
    expect(det.status).toBe("multiple-strips");
    expect(assessQuality(px, det).passed).toBe(false);
  });
  it("rejects a photo with no pads", () => {
    const px = makePixels(200, 300, []);
    const q = assessQuality(px, detectStrip(px));
    expect(q.checks.find((c) => c.id === "pads-visible")?.status).toBe("fail");
  });
  it("rejects warm yellow light", () => {
    const px = makePixels(200, 300, [[90, 40, 22, 22, [120, 200, 160]], [90, 70, 22, 22, [200, 150, 60]]], [235, 210, 150]);
    const q = assessQuality(px, detectStrip(px));
    expect(q.checks.find((c) => c.id === "lighting")?.message).toMatch(/too yellow/);
  });
});

describe("demo configuration", () => {
  it("is labelled demo and not validated", () => {
    expect(demoReferenceConfig.stripName).toBe("CYBOW 2AC — Demo only");
    expect(demoReferenceConfig.status).toBe("demo");
    expect(configurationStatusLabel(demoReferenceConfig)).toBe("Demo configuration — not validated for clinical use.");
  });
  it("uses neutral Pad A / Pad B and demo levels 1–3", () => {
    expect(demoReferenceConfig.pads.map((p) => p.label)).toEqual(["Pad A", "Pad B"]);
    for (const p of demoReferenceConfig.pads) expect(p.levels.map((l) => l.displayName)).toEqual(["Demo level 1", "Demo level 2", "Demo level 3"]);
  });
});

describe("safety notice", () => {
  it("has no dismiss control", () => {
    render(<SafetyNotice title="Screening estimate only." />);
    const n = screen.getByTestId("safety-notice");
    expect(n).toHaveTextContent("Do not use this screen alone for a medical decision");
    expect(n.querySelector("button")).toBeNull();
  });
});

describe("saving consent", () => {
  it("defaults to not saving", () => expect(DEFAULT_SAVE_CHOICE).toBe("none"));
});

const scan: Scan = {
  id: "s1", createdAt: new Date().toISOString(), source: "upload", image: "data:image/jpeg;base64,xx",
  quality: { score: 100, label: "Good", checks: [] },
  configuration: { id: demoReferenceConfig.id, status: "demo" },
  pads: [{ id: "pad-a", bounds: { x: 0, y: 0, width: 0.1, height: 0.1 }, sampledColor: "#BBD4C9", resultLevel: "a2", matchConfidence: 86 }],
  state: "estimate-available",
};

describe("local history", () => {
  beforeEach(() => localStorage.clear());
  it("drops the photo when saving result only", () => {
    expect(localHistory.save(scan, "result-only").image).toBeUndefined();
  });
  it("deletes one and all saved scans", () => {
    localHistory.save(scan, "result-only");
    localHistory.save({ ...scan, id: "s2" }, "result-and-photo");
    localHistory.remove("s1");
    expect(localHistory.list().map((s) => s.id)).toEqual(["s2"]);
    localHistory.clear();
    expect(localHistory.list()).toEqual([]);
  });
});

describe("result card", () => {
  it("shows demo level, match and unconfirmed reference", () => {
    render(<ResultCard pad={demoReferenceConfig.pads[0]} result={scan.pads[0]} validated={false} />);
    const card = screen.getByTestId("result-pad-a");
    expect(card).toHaveTextContent("Demo level 2");
    expect(card).toHaveTextContent("86%");
    expect(card).toHaveTextContent("Confirmed referenceNo");
  });
});
