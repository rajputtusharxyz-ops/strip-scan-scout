import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider, createRoute, Outlet } from "@tanstack/react-router";
import { analyzeImage, normalizeResponse } from "@/services/analysisApi";
import { runAnalysis, scanSession } from "@/services/scanSession";
import { ScanResultView } from "@/components/results/ScanResultView";
import { ANALYSIS_STATUSES } from "@/types/analysis";
import type { Scan } from "@/types/scan";
import { Route as SettingsRoute } from "@/routes/settings";

const IMG = "data:image/png;base64,iVBORw0KGgo=";
const ok = { status: "complete", albuminMgL: 30, creatinineMgL: 1000, acr: 30, detectionConfidence: { albumin: 0.91, creatinine: 0.88 }, capturedAt: "2026-01-01T10:00:00Z", analysisBuild: "b1", errorCode: null, message: null };
const respond = (body: unknown, status = 200) => (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

function renderInRouter(ui: React.ReactNode) {
  const root = createRootRoute({ component: () => <Outlet /> });
  const idx = createRoute({ getParentRoute: () => root, path: "/", component: () => <>{ui}</> });
  const router = createRouter({ routeTree: root.addChildren([idx]), history: createMemoryHistory() });
  return render(<RouterProvider router={router} />);
}

const scanWith = (analysis: Scan["analysis"]): Scan => ({ id: "x", createdAt: analysis.capturedAt, source: "upload", quality: { score: 100, label: "Good", checks: [] }, analysis });

describe("analysis contract", () => {
  it("covers exactly the five statuses", () => {
    expect([...ANALYSIS_STATUSES]).toEqual(["complete", "retake_required", "invalid_image", "analysis_unavailable", "error"]);
  });
  it("rejects zero creatinine", () => {
    const r = normalizeResponse({ ...ok, creatinineMgL: 0 });
    expect(r.status).toBe("error");
    expect(r.acr).toBeNull();
  });
  it("rejects negative creatinine", () => {
    expect(normalizeResponse({ ...ok, creatinineMgL: -5 }).status).toBe("error");
  });
  it("strips numbers from a retake_required response", () => {
    const r = normalizeResponse({ ...ok, status: "retake_required", errorCode: "pads_missing" });
    expect(r.albuminMgL).toBeNull();
    expect(r.acr).toBeNull();
  });
  it("reports unavailable when the service is not configured", async () => {
    expect((await analyzeImage(IMG, respond(ok), "")).status).toBe("analysis_unavailable");
  });
  it("reports unavailable on network failure and 5xx", async () => {
    const boom = (async () => { throw new Error("down"); }) as unknown as typeof fetch;
    expect((await analyzeImage(IMG, boom, "https://svc")).status).toBe("analysis_unavailable");
    expect((await analyzeImage(IMG, respond({}, 503), "https://svc")).status).toBe("analysis_unavailable");
  });
  it("passes through an invalid_image response for a corrupt or oversized upload", async () => {
    const r = await analyzeImage(IMG, respond({ ...ok, status: "invalid_image", albuminMgL: null, creatinineMgL: null, acr: null, errorCode: "too_large" }, 413), "https://svc");
    expect(r.status).toBe("invalid_image");
  });
});

describe("results screen", () => {
  it("renders albumin, creatinine and ACR when complete", async () => {
    renderInRouter(<ScanResultView scan={scanWith(normalizeResponse(ok))} />);
    expect(await screen.findByTestId("result-albumin")).toHaveTextContent("30.0mg/L");
    expect(screen.getByTestId("result-creatinine")).toHaveTextContent("1,000.0mg/L");
    expect(screen.getByTestId("result-acr")).toHaveTextContent("30.0");
  });
  it("shows the unavailable state with no values", async () => {
    renderInRouter(<ScanResultView scan={scanWith(normalizeResponse({ ...ok, status: "analysis_unavailable" }))} onRetry={() => {}} />);
    expect(await screen.findByText("Analysis service is unavailable")).toBeInTheDocument();
    expect(screen.queryByTestId("result-values")).toBeNull();
  });
});

describe("no stale data", () => {
  beforeEach(() => scanSession.reset());
  it("replaces a previous complete result with the new error", async () => {
    scanSession.update({ image: IMG, quality: { score: 100, label: "Good", checks: [], passed: true }, result: scanWith(normalizeResponse(ok)) });
    // service not configured in tests → unavailable
    const first = await runAnalysis(respond(ok));
    expect(first.analysis.status).toBe("analysis_unavailable");
    expect(scanSession.get().result?.analysis.albuminMgL).toBeNull();
  });
});

describe("settings", () => {
  it("exposes no model, demo or configuration controls", async () => {
    const Settings = SettingsRoute.options.component!;
    renderInRouter(<Settings />);
    await screen.findByText("Analysis service");
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(document.body.textContent).not.toMatch(/model|demo|reference configuration/i);
  });
});
