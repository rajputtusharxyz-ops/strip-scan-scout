import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DESC = {
  Good: "All photo checks passed. This describes the photo, not clinical accuracy.",
  Fair: "The photo is usable but some checks were borderline. Consider a retake in better light.",
  Poor: "One or more photo checks failed. Results may not be reliable.",
};

export function ConfidenceBadge({ label }: { label: "Good" | "Fair" | "Poor" }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold ${label === "Good" ? "border-primary/30 bg-secondary" : "border-caution-border bg-caution-surface"}`}>
            Photo quality: {label}
            <Info className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{DESC[label]}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
