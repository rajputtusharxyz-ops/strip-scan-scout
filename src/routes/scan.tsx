import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, CheckCircle2, Droplets, ImageUp, Layers, Loader2, RotateCcw, Sun, Timer, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageContainer } from "@/components/shared/AppShell";
import { ProgressHeader } from "@/components/shared/ProgressHeader";
import { ErrorState } from "@/components/shared/States";
import { CaptureFrame } from "@/components/capture/CaptureFrame";
import { QualityCheckList } from "@/components/capture/QualityCheckList";
import { StripOverlayEditor } from "@/components/capture/StripOverlayEditor";
import { PadSwatch } from "@/components/capture/PadSwatch";
import { createSamplePhoto, runAnalysis, runQualityCheck, scanSession, useScanSession } from "@/services/scanSession";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan one strip — Cybow2AC Strip App" },
      { name: "description", content: "Prepare, capture, check and confirm one test strip photo before seeing a screening estimate." },
      { property: "og:title", content: "Scan one strip — Cybow2AC Strip App" },
      { property: "og:description", content: "A guided four-step capture flow for one test strip." },
    ],
  }),
  component: ScanPage,
});

type Stage = "prepare" | "capture" | "check" | "review" | "processing";

const CHECKLIST = [
  { icon: Layers, t: "Use one strip only", d: "Remove other strips and the bottle from the photo." },
  { icon: Timer, t: "Wait the correct time", d: "Use the reading time printed in your strip instructions. [Placeholder: enter validated time here]." },
  { icon: Sun, t: "Choose even light", d: "Use bright indirect daylight or even white light. Avoid direct sun, flash, coloured bulbs, and heavy shadows." },
  { icon: Square, t: "Use a plain background", d: "Place the strip on a clean white or light-grey surface." },
  { icon: Droplets, t: "Keep the pads dry and visible", d: "Do not touch the reagent pads. Keep the pad end fully in frame." },
];

function ScanPage() {
  const navigate = useNavigate();
  const session = useScanSession();
  const [stage, setStage] = useState<Stage>("prepare");
  const [ack, setAck] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => { window.scrollTo(0, 0); }, [stage]);

  async function handleImage(image: string, source: "camera" | "upload") {
    scanSession.reset();
    scanSession.update({ image, source });
    setCheckError(null);
    setStage("check");
    try {
      const { quality, bounds } = await runQualityCheck(image);
      scanSession.update({ quality, bounds });
    } catch (e) {
      setCheckError((e as Error).message);
    }
  }

  async function analyse() {
    setStage("processing");
    try {
      await runAnalysis();
      navigate({ to: "/results" });
    } catch (e) {
      setCheckError((e as Error).message);
      setStage("check");
    }
  }

  return (
    <PageContainer narrow>
      {stage === "prepare" && (
        <>
          <ProgressHeader step={1} label="Prepare" />
          <h1 className="text-3xl font-semibold">Before you take the photo</h1>
          <p className="mt-2 text-muted-foreground">Cybow2AC Strip App reads <strong className="text-foreground">one strip per photo</strong>. A few checks now prevent unusable images.</p>
          <ol className="mt-6 space-y-3">
            {CHECKLIST.map((c, i) => (
              <li key={c.t} className="card-surface flex gap-4 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary"><c.icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" /></span>
                <div>
                  <p className="font-semibold"><span className="tabular text-muted-foreground">{i + 1}.</span> {c.t}</p>
                  <p className="text-[0.95rem] text-foreground/80">{c.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <label htmlFor="ack" className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4">
            <Checkbox id="ack" checked={ack} onCheckedChange={(v) => setAck(v === true)} className="mt-0.5 h-5 w-5" />
            <span>I have checked the strip instructions and I am ready to capture one strip.</span>
          </label>
          <Button size="lg" className="mt-4 w-full" disabled={!ack} onClick={() => setStage("capture")}>
            <Camera strokeWidth={1.5} /> Continue to camera
          </Button>
        </>
      )}

      {stage === "capture" && (
        <>
          <ProgressHeader step={2} label="Capture" onBack={() => setStage("prepare")} aside={<Link to="/guide" hash="photo-tips" className="text-sm font-semibold text-primary hover:underline">How to take a good photo</Link>} />
          <h1 className="sr-only">Capture one strip</h1>
          <CaptureFrame onCapture={handleImage} onSample={() => handleImage(createSamplePhoto(), "upload")} />
        </>
      )}

      {stage === "check" && (
        <>
          <ProgressHeader step={3} label="Check photo" onBack={() => setStage("capture")} />
          <h1 className="text-2xl font-semibold">Is this photo usable?</h1>
          <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,240px)_1fr]">
            {session.image && <img src={session.image} alt="Your captured strip photo" className="max-h-80 w-full rounded-xl border bg-card object-contain" />}
            <div className="space-y-4">
              {checkError ? (
                <ErrorState icon={ImageUp} title="We could not check this photo">{checkError}</ErrorState>
              ) : (
                <>
                  <QualityCheckList checks={session.quality?.checks} />
                  <div aria-live="assertive" className="sr-only">
                    {session.quality && (session.quality.passed ? "Photo check passed." : `Photo rejected: ${session.quality.checks.find((c) => c.status === "fail")?.message}`)}
                  </div>
                  {session.quality?.passed && (
                    <p className="flex items-start gap-2 rounded-lg bg-secondary px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
                      This photo looks usable. Please check the detected pad areas.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            <Button size="lg" variant={session.quality?.passed ? "outline" : "caution"} onClick={() => setStage("capture")}><RotateCcw strokeWidth={1.5} /> Retake photo</Button>
            <Button size="lg" variant="outline" onClick={() => setStage("capture")}><ImageUp strokeWidth={1.5} /> Choose another photo</Button>
            <Button size="lg" disabled={!session.quality?.passed} onClick={() => setStage("review")}>Continue to pad review</Button>
          </div>
        </>
      )}

      {stage === "review" && session.image && session.bounds && (
        <>
          <ProgressHeader step={4} label="Confirm pad areas" onBack={() => setStage("check")} />
          <h1 className="text-2xl font-semibold">Confirm the two pad outlines</h1>
          <p className="mt-2 text-muted-foreground">Check that the strip and both pads are clearly visible and that only one strip is in the photo. The analysis service locates the albumin and creatinine pads itself; these outlines are for your review.</p>
          <div className="mt-5">
            <StripOverlayEditor image={session.image} bounds={session.bounds} onChange={(bounds) => scanSession.update({ bounds })} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PadSwatch image={session.image} bounds={session.bounds["pad-a"]} label="Pad A" />
            <PadSwatch image={session.image} bounds={session.bounds["pad-b"]} label="Pad B" />
          </div>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            <Button size="lg" variant="ghost" onClick={() => setStage("check")}>Back</Button>
            <Button size="lg" variant="outline" onClick={() => setStage("capture")}><RotateCcw strokeWidth={1.5} /> Retake photo</Button>
            <Button size="lg" onClick={analyse}>Analyse</Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Your photo is sent securely to the analysis service for this scan and is not saved by default.</p>
        </>
      )}

      {stage === "processing" && (
        <div className="card-surface mt-10 flex flex-col items-center p-10 text-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 font-semibold">Analysing your strip…</p>
          <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
        </div>
      )}
    </PageContainer>
  );
}
