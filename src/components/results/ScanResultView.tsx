import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Camera, ChevronDown, CloudOff, Download, ImageOff, RotateCcw, Save, Share2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SafetyNotice, WHEN_TO_GET_HELP } from "@/components/shared/SafetyNotice";
import { ErrorState } from "@/components/shared/States";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ConsentSaveDialog, type SaveChoice } from "./ConsentSaveDialog";
import type { Scan } from "@/types/scan";
import type { AnalysisResponse } from "@/types/analysis";
import { isComplete } from "@/services/analysisApi";
import { buildSummary, fmt, formatCaptured } from "@/services/summary";
import { localHistory } from "@/services/localHistory";
import { downscaleDataUrl } from "@/lib/image";
import { APP_NAME } from "@/config/app";

export function shareOrDownload(scan: Scan) {
  const text = buildSummary(scan);
  if (navigator.share) {
    navigator.share({ title: `${APP_NAME} summary`, text }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `cybow2ac-summary-${scan.createdAt.slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const pct = (v: number | null) => (v == null ? "–" : `${Math.round(v * 100)}%`);

function ResultRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="card-surface flex items-baseline justify-between gap-4 p-5" data-testid={`result-${label.toLowerCase()}`}>
      <p className="text-lg font-medium">{label}</p>
      <p className="tabular font-heading text-3xl font-medium">
        {fmt(value)}
        {unit && <span className="ml-1.5 font-sans text-base text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

function NoResult({ analysis, onRetry }: { analysis: AnalysisResponse; onRetry?: () => void }) {
  if (analysis.status === "analysis_unavailable") {
    return (
      <ErrorState icon={CloudOff} title="Analysis service is unavailable" action={<>{onRetry && <Button onClick={onRetry}><RotateCcw strokeWidth={1.5} /> Try again</Button>}<Button variant="outline" asChild><Link to="/scan">Retake photo</Link></Button></>}>
        {analysis.message ?? "We could not reach the analysis service."} No result has been produced for this photo. Please try again in a moment.
      </ErrorState>
    );
  }
  const title = analysis.status === "invalid_image" ? "This image could not be used" : analysis.status === "retake_required" ? "Please retake the photo" : "We could not produce a result";
  const hint = analysis.status === "retake_required"
    ? "Both the albumin and creatinine pads must be clearly found on a single strip. Use even light, a plain background and keep the pad end fully in frame."
    : "Try a new, clear photo of one strip.";
  return (
    <ErrorState icon={ImageOff} title={title} action={<Button variant="caution" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Retake photo</Link></Button>}>
      {analysis.message ? `${analysis.message} ` : ""}{hint}
    </ErrorState>
  );
}

export function ScanResultView({ scan, saved = false, onRetry }: { scan: Scan; saved?: boolean; onRetry?: () => void }) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);
  const a = scan.analysis;
  const complete = isComplete(a);

  async function onSave(choice: SaveChoice) {
    setSaveOpen(false);
    if (choice === "none") { toast("Nothing was saved."); return; }
    try {
      const image = choice === "result-and-photo" && scan.image ? await downscaleDataUrl(scan.image, 700) : undefined;
      localHistory.save({ ...scan, image }, choice);
      setIsSaved(true);
      toast.success(choice === "result-only" ? "Result saved on this device." : "Result and photo saved on this device.");
    } catch {
      toast.error("This browser’s storage is full. Try saving the result only.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/scan" className="inline-flex min-h-11 items-center gap-1.5 text-[0.95rem] font-medium text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> New scan
        </Link>
        <h1 className="mt-2 text-3xl md:text-4xl">{complete ? "Your screening estimate" : "No result for this photo"}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="tabular text-muted-foreground">{formatCaptured(scan.createdAt)}.</p>
          <ConfidenceBadge label={scan.quality.label} />
        </div>
      </div>

      <SafetyNotice title="Screening estimate only." />

      {complete ? (
        <>
          <div className="grid gap-3" data-testid="result-values">
            <ResultRow label="Albumin" value={a.albuminMgL} unit="mg/L" />
            <ResultRow label="Creatinine" value={a.creatinineMgL} unit="mg/L" />
            <ResultRow label="ACR" value={a.acr} unit="mg/g" />
          </div>
          <p className="tabular text-sm text-muted-foreground">
            Photo quality: {scan.quality.label} · Pad detection confidence — albumin {pct(a.detectionConfidence.albumin)}, creatinine {pct(a.detectionConfidence.creatinine)}
          </p>
          <Collapsible className="card-surface">
            <CollapsibleTrigger className="group flex min-h-14 w-full items-center justify-between px-5 text-left font-heading text-lg">
              About this result
              <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" strokeWidth={1.5} aria-hidden="true" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 px-5 pb-5 leading-relaxed text-foreground/85">
              <p>The analysis service located the albumin and creatinine pads in your photo and estimated each concentration in mg/L. ACR is calculated as albumin divided by creatinine, multiplied by 1000.</p>
              <p>These are screening estimates. They are not labelled normal or abnormal and have not been clinically validated. Compare with the manufacturer’s chart for your strip lot and talk to a health professional about what they mean for you.</p>
            </CollapsibleContent>
          </Collapsible>
        </>
      ) : (
        <NoResult analysis={a} onRetry={onRetry} />
      )}

      <SafetyNotice variant="urgent-placeholder" title="When to get help">{WHEN_TO_GET_HELP}</SafetyNotice>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {complete && <Button size="lg" onClick={() => setSaveOpen(true)} disabled={isSaved}><Save strokeWidth={1.5} /> {isSaved ? "Saved on this device" : "Save to this device"}</Button>}
        {complete && (
          <Button size="lg" variant="outline" onClick={() => shareOrDownload(scan)}>
            {typeof navigator !== "undefined" && "share" in navigator ? <Share2 strokeWidth={1.5} /> : <Download strokeWidth={1.5} />} Share a summary
          </Button>
        )}
        <Button size="lg" variant="outline" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan another strip</Link></Button>
        <Button size="lg" variant="ghost" asChild><Link to="/guide"><BookOpen strokeWidth={1.5} /> Read the guide</Link></Button>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Stethoscope className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Not a diagnosis or a replacement for the strip instructions.</p>

      <ConsentSaveDialog open={saveOpen} onOpenChange={setSaveOpen} onConfirm={onSave} />
    </div>
  );
}
