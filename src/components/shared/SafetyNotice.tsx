import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SAFETY_TEXT =
  "Lighting, timing, strip handling, camera settings, and the correct strip lot can affect the result. Do not use this screen alone for a medical decision. Compare with the manufacturer’s chart and seek professional advice when needed.";

export const WHEN_TO_GET_HELP =
  "If you feel unwell, have symptoms that worry you, are pregnant, or have been told you have kidney disease or diabetes, use the manufacturer’s instructions and contact a qualified health professional for advice. For severe or urgent symptoms, seek local emergency care.";

type Variant = "standard" | "caution" | "urgent-placeholder";

/** Non-dismissible by design: there is intentionally no close control. */
export function SafetyNotice({ variant = "caution", title, children, className }: { variant?: Variant; title?: string; children?: ReactNode; className?: string }) {
  const Icon = variant === "standard" ? Info : variant === "caution" ? AlertTriangle : ShieldAlert;
  return (
    <aside
      role="note"
      data-testid="safety-notice"
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        variant === "standard" && "border-border bg-secondary",
        variant === "caution" && "border-caution-border bg-caution-surface",
        variant === "urgent-placeholder" && "border-caution-border bg-card",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", variant === "standard" ? "text-primary" : "text-caution")} strokeWidth={1.5} aria-hidden="true" />
      <div className="text-[0.95rem] leading-relaxed">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <div className="text-foreground/85">{children ?? SAFETY_TEXT}</div>
      </div>
    </aside>
  );
}
