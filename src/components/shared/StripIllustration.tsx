/** Small neutral vertical strip. Pads are drawn in grey so no colour competes with real pads. */
export function StripIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 260" className={className} role="img" aria-label="One test strip">
      <rect x="18" y="8" width="24" height="244" rx="3" className="fill-card stroke-border" strokeWidth="1.5" />
      <rect x="22" y="22" width="16" height="16" rx="2" className="fill-muted stroke-border" />
      <rect x="22" y="46" width="16" height="16" rx="2" className="fill-muted stroke-border" />
    </svg>
  );
}
