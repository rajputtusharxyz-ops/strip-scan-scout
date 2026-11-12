import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Camera, Check, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SafetyNotice } from "@/components/shared/SafetyNotice";
import type { Scan } from "@/types/scan";
import { isComplete } from "@/services/analysisApi";
import { fmt, formatCaptured } from "@/services/summary";
import { localHistory } from "@/services/localHistory";

function ResultRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b px-5 py-4 last:border-b-0" data-testid={`result-${label.toLowerCase()}`}>
      <p className="font-medium">{label}</p>
      <p className="tabular text-2xl font-semibold">
        {fmt(value)}
        {unit && <span className="tabular ml-1.5 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export function ScanResultView({ scan, saved = false, onRetry }: { scan: Scan; saved?: boolean; onRetry?: (() => void) | undefined }) {
  const [isSaved, setIsSaved] = useState(saved);
  const a = scan.analysis;

  if (!isComplete(a)) {
    const unavailable = a.status === "analysis_unavailable";
    return (
      <div role="alert" className="rounded-xl border border-caution-border bg-caution-surface p-6 text-center">
        <p className="font-medium text-destructive">{unavailable ? "Analysis is unavailable right now. Please try again later." : "Photo could not be read. Retake photo."}</p>
        {unavailable && onRetry
          ? <Button size="lg" className="mt-5" onClick={onRetry}><RotateCcw strokeWidth={1.5} /> Try again</Button>
          : <Button size="lg" className="mt-5" asChild><Link to="/scan"><RotateCcw strokeWidth={1.5} /> Retake photo</Link></Button>}
      </div>
    );
  }

  function save() {
    try {
      localHistory.save(scan, "result-only");
      setIsSaved(true);
      toast.success("Scan saved");
    } catch {
      toast.error("Could not save this scan");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Result</h1>
        <span className="rounded-full border bg-card px-3 py-1 text-sm">Analysis complete</span>
      </div>
      <p className="tabular text-muted-foreground">{formatCaptured(scan.createdAt)}</p>
      <div className="card-surface" data-testid="result-values">
        <ResultRow label="Albumin" value={a.albuminMgL} unit="mg/L" />
        <ResultRow label="Creatinine" value={a.creatinineMgL} unit="mg/L" />
        <ResultRow label="ACR" value={a.acr} unit="mg/g" />
      </div>
      <SafetyNotice />
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button size="lg" onClick={save} disabled={isSaved}>{isSaved ? <><Check strokeWidth={1.5} /> Saved</> : <><Save strokeWidth={1.5} /> Save scan</>}</Button>
        <Button size="lg" variant="outline" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan another</Link></Button>
      </div>
    </div>
  );
}
