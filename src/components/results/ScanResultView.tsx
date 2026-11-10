import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Camera, ChevronDown, Download, ImageOff, RotateCcw, Save, Share2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SafetyNotice, WHEN_TO_GET_HELP } from "@/components/shared/SafetyNotice";
import { ErrorState } from "@/components/shared/States";
import { ResultCard } from "./ResultCard";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { ConsentSaveDialog, type SaveChoice } from "./ConsentSaveDialog";
import type { Scan } from "@/types/scan";
import { getConfigurationById, configurationStatusLabel } from "@/services/referenceConfigService";
import { buildSummary, formatCaptured } from "@/services/summary";
import { localHistory } from "@/services/localHistory";
import { downscaleDataUrl } from "@/lib/image";

export function shareOrDownload(scan: Scan) {
  const text = buildSummary(scan);
  if (navigator.share) {
    navigator.share({ title: "Cybow2AC Strip App summary", text }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `stripguide-summary-${scan.createdAt.slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ScanResultView({ scan, saved = false }: { scan: Scan; saved?: boolean }) {
  const cfg = getConfigurationById(scan.configuration.id);
  const [saveOpen, setSaveOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

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
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Your screening estimate</h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="tabular text-muted-foreground">{formatCaptured(scan.createdAt)}.</p>
          <ConfidenceBadge label={scan.quality.label} />
        </div>
      </div>

      <SafetyNotice title="Screening estimate only." />

      <p className="rounded-lg border bg-card px-4 py-3 text-sm">
        <span className="font-semibold">{cfg?.stripName ?? "Unknown configuration"}</span> · {configurationStatusLabel(scan.configuration)}
      </p>

      {scan.state === "needs-better-photo" && (
        <ErrorState icon={ImageOff} title="Unable to provide a reliable estimate" action={<Button variant="caution" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Retake photo</Link></Button>}>
          At least one pad colour did not match the reference closely enough. Retake the photo in even, neutral light, or compare the strip with the official chart.
        </ErrorState>
      )}
      {scan.state === "cannot-analyse" && (
        <ErrorState icon={ImageOff} title="We could not read the pad areas" action={<><Button asChild><Link to="/scan">Try another photo</Link></Button><Button variant="outline" asChild><Link to="/guide">Read the guide</Link></Button></>}>
          The selected areas had no usable colour. Make sure each outline covers only its coloured pad.
        </ErrorState>
      )}

      {cfg && scan.state !== "cannot-analyse" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {cfg.pads.map((pad) => {
            const r = scan.pads.find((p) => p.id === pad.id);
            return r ? <ResultCard key={pad.id} pad={pad} result={r} validated={cfg.status === "validated"} /> : null;
          })}
        </div>
      )}

      <section className="card-surface p-5">
        <h2 className="text-lg font-bold">What this could mean</h2>
        <p className="mt-1 text-sm font-semibold text-caution">Educational placeholder</p>
        <p className="mt-2 leading-relaxed">
          This screen compared the two visible pad colours with a demo reference configuration. It cannot confirm a medical result. Check the manufacturer’s colour chart for your exact strip lot and speak with a qualified health professional if you have questions or symptoms. This content is illustrative until verified medical content is supplied.
        </p>
      </section>

      <section className="card-surface p-5">
        <h2 className="text-lg font-bold">What to do next</h2>
        <ol className="mt-3 space-y-2.5">
          {["Compare with the container chart.", "Repeat only according to the official instructions if needed.", "Talk to a clinician if you have concerns or symptoms."].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary">{i + 1}</span>
              <span className="pt-0.5">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      <SafetyNotice variant="urgent-placeholder" title="When to get help">{WHEN_TO_GET_HELP}</SafetyNotice>

      <Collapsible className="card-surface">
        <CollapsibleTrigger className="group flex min-h-14 w-full items-center justify-between px-5 text-left font-heading text-lg font-bold">
          Why we are cautious
          <ChevronDown className="h-5 w-5 transition-transform duration-200 group-data-[state=open]:rotate-180" strokeWidth={1.5} aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-5 leading-relaxed text-foreground/85">
          Colour-based strip readings change with lighting, the time since dipping, how the strip was stored and handled, and how each phone camera processes colour. A plain white background helps but is not a calibrated reference. Until a validated, lot-specific configuration and calibration procedure are in place, Cybow2AC Strip App only shows demo levels.
        </CollapsibleContent>
      </Collapsible>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button size="lg" onClick={() => setSaveOpen(true)} disabled={isSaved}><Save strokeWidth={1.5} /> {isSaved ? "Saved on this device" : "Save to this device"}</Button>
        <Button size="lg" variant="outline" onClick={() => shareOrDownload(scan)}>
          {typeof navigator !== "undefined" && "share" in navigator ? <Share2 strokeWidth={1.5} /> : <Download strokeWidth={1.5} />} Share a summary
        </Button>
        <Button size="lg" variant="outline" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan another strip</Link></Button>
        <Button size="lg" variant="ghost" asChild><Link to="/guide"><BookOpen strokeWidth={1.5} /> Read the guide</Link></Button>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Stethoscope className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Not a diagnosis or a replacement for the strip instructions.</p>

      <ConsentSaveDialog open={saveOpen} onOpenChange={setSaveOpen} onConfirm={onSave} />
    </div>
  );
}
