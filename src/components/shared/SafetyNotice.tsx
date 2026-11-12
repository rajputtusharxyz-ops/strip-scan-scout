import { Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SAFETY_TEXT = "Screening estimate only. Not a diagnosis. Do not use this screen alone for a medical decision.";

/** Non-dismissible by design: there is intentionally no close control. */
export function SafetyNotice({ children, className }: { title?: string; children?: ReactNode; className?: string }) {
  return (
    <aside role="note" data-testid="safety-notice" className={cn("flex gap-2.5 text-sm text-muted-foreground", className)}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
      <p>{children ?? SAFETY_TEXT}</p>
    </aside>
  );
}
