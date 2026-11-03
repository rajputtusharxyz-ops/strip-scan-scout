import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { QualityCheck } from "@/types/scan";

const LABELS = ["One strip found", "Both pads visible", "Strip is in focus", "Lighting is even", "No strong glare", "Background is plain"];

export function QualityCheckList({ checks }: { checks?: QualityCheck[] }) {
  if (!checks) {
    return (
      <ul className="space-y-2" aria-busy="true">
        {LABELS.map((l) => (
          <li key={l} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} aria-hidden="true" /> {l}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="space-y-2">
      {checks.map((c) => {
        const Icon = c.status === "pass" ? CheckCircle2 : c.status === "warning" ? AlertTriangle : XCircle;
        const statusText = c.status === "pass" ? "Passed" : c.status === "warning" ? "Check" : "Needs attention";
        return (
          <li key={c.id} className={`rounded-lg border px-4 py-3 ${c.status === "fail" ? "border-caution-border bg-caution-surface" : "bg-card"}`}>
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${c.status === "pass" ? "text-primary" : "text-caution"}`} strokeWidth={1.5} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 font-semibold">
                  {c.label}
                  <span className="text-sm font-medium text-muted-foreground">{statusText}</span>
                </p>
                <p className="text-[0.95rem] text-foreground/80">{c.message}</p>
                {c.advice && <p className="mt-1 text-[0.95rem] font-medium">{c.advice}</p>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
