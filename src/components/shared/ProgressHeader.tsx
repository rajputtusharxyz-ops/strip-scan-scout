import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function ProgressHeader({ step, label, onBack, aside }: { step: number; label: string; onBack?: () => void; aside?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        {onBack ? (
          <button onClick={onBack} className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[0.95rem] font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Back
          </button>
        ) : <span />}
        {aside}
      </div>
      <p className="tabular text-sm font-semibold text-primary">
        Step {step} of 4 — {label}
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={step}
        aria-label={`Step ${step} of 4: ${label}`}
        className="mt-2 grid grid-cols-4 gap-1.5"
      >
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-colors duration-200 ${i <= step ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}
