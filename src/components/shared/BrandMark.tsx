import { APP_NAME } from "@/config/app";

export function StripIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-primary" />
      <rect x="12" y="5" width="8" height="22" rx="1.5" className="fill-card" />
      <rect x="13.5" y="7.5" width="5" height="4" rx="0.6" className="fill-secondary" />
      <rect x="13.5" y="13" width="5" height="4" rx="0.6" className="fill-caution-surface" />
    </svg>
  );
}

export function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <StripIcon />
      <span className="font-heading text-lg font-bold tracking-tight">{APP_NAME}</span>
    </span>
  );
}
