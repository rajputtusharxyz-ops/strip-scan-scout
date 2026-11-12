import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, Loader2, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { CaptureFrame } from "@/components/capture/CaptureFrame";
import { StepList } from "@/routes/guide";
import { DIP_SECONDS, WAIT_SECONDS } from "@/config/app";
import { runAnalysis, runQualityCheck, scanSession } from "@/services/scanSession";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan strip — ACR Strip Reader" },
      { name: "description", content: "Prepare and photograph one test strip for an albumin, creatinine and ACR screening estimate." },
      { property: "og:title", content: "Scan strip — ACR Strip Reader" },
      { property: "og:description", content: "Photograph one test strip." },
    ],
  }),
  component: ScanPage,
});

type Stage = "prepare" | "capture" | "processing" | "invalid" | "unavailable";
type TimerPhase = { phase: "dip" | "wait"; left: number } | "done" | null;

function StripTimer() {
  const [t, setT] = useState<TimerPhase>(null);
  useEffect(() => {
    if (!t || t === "done") return;
    const id = window.setTimeout(() => {
      if (t.left > 1) setT({ ...t, left: t.left - 1 });
      else setT(t.phase === "dip" ? { phase: "wait", left: WAIT_SECONDS } : "done");
    }, 1000);
    return () => window.clearTimeout(id);
  }, [t]);
  if (!t) return <Button variant="outline" size="lg" onClick={() => setT({ phase: "dip", left: DIP_SECONDS })}><Timer strokeWidth={1.5} /> Start timer</Button>;
  return (
    <div className="card-surface flex items-center justify-between gap-4 px-5 py-4" role="timer" aria-live="polite">
      <span>{t === "done" ? "Ready for the photo" : t.phase === "dip" ? "Dip the strip" : "Wait"}</span>
      <span className="tabular text-2xl font-semibold">{t === "done" ? "0 s" : `${t.left} s`}</span>
    </div>
  );
}

function ScanPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("prepare");
  useEffect(() => { window.scrollTo(0, 0); }, [stage]);

  async function analyse() {
    setStage("processing");
    try {
      const scan = await runAnalysis();
      const s = scan.analysis.status;
      if (s === "complete") navigate({ to: "/results" });
      else setStage(s === "analysis_unavailable" ? "unavailable" : "invalid");
    } catch {
      setStage("invalid");
    }
  }

  async function handleImage(image: string, source: "camera" | "upload") {
    scanSession.reset();
    scanSession.update({ image, source });
    setStage("processing");
    try {
      const { quality, bounds } = await runQualityCheck(image);
      scanSession.update({ quality, bounds });
      if (!quality.passed) { setStage("invalid"); return; }
    } catch {
      setStage("invalid");
      return;
    }
    await analyse();
  }

  return (
    <PageContainer narrow>
      {stage === "prepare" && (
        <>
          <h1 className="text-3xl">Prepare your strip</h1>
          <div className="mt-6"><StepList /></div>
          <div className="mt-6 grid gap-2.5">
            <StripTimer />
            <Button size="lg" onClick={() => setStage("capture")}><Camera strokeWidth={1.5} /> Continue to camera</Button>
          </div>
        </>
      )}

      {stage === "capture" && (
        <>
          <h1 className="sr-only">Take a photo of one strip</h1>
          <CaptureFrame onCapture={handleImage} />
        </>
      )}

      {stage === "processing" && (
        <div className="card-surface mt-10 flex flex-col items-center p-10 text-center" role="status" aria-live="polite">
          <Loader2 className="h-7 w-7 animate-spin text-primary" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 font-medium">Analysing strip</p>
        </div>
      )}

      {stage === "invalid" && (
        <div role="alert" className="mt-10 rounded-xl border border-caution-border bg-caution-surface p-6 text-center">
          <p className="font-medium text-destructive">Photo could not be read. Retake photo.</p>
          <Button size="lg" className="mt-5" onClick={() => setStage("capture")}><RotateCcw strokeWidth={1.5} /> Retake photo</Button>
        </div>
      )}

      {stage === "unavailable" && (
        <div role="alert" className="mt-10 rounded-xl border border-caution-border bg-caution-surface p-6 text-center">
          <p className="font-medium text-destructive">Analysis is unavailable right now. Please try again later.</p>
          <Button size="lg" className="mt-5" onClick={() => { analyse(); }}><RotateCcw strokeWidth={1.5} /> Try again</Button>
        </div>
      )}
    </PageContainer>
  );
}
