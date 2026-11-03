/** Flat illustrated single strip on a pale surface — deliberately not a real sample photo. */
export function StripIllustration({ className = "", variant = "good" }: { className?: string; variant?: "good" | "warm" | "multiple" | "shadow" }) {
  const surface = variant === "warm" ? "oklch(0.9 0.06 80)" : "oklch(0.95 0.006 100)";
  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label={
      variant === "good" ? "Illustration of one test strip on a plain light surface" :
      variant === "warm" ? "Illustration of a strip under yellow light" :
      variant === "multiple" ? "Illustration of several strips in one photo" : "Illustration of a strip with a heavy shadow"
    }>
      <rect width="200" height="260" rx="14" fill={surface} />
      {variant === "shadow" && <path d="M0 0 L120 0 L60 260 L0 260 Z" fill="oklch(0.31 0.04 222 / 22%)" />}
      {(variant === "multiple" ? [-38, 0, 38] : [0]).map((dx) => (
        <g key={dx} transform={`translate(${dx} 0)`}>
          <rect x="88" y="24" width="24" height="214" rx="3" fill="oklch(1 0 0)" stroke="oklch(0.88 0.01 170)" />
          <rect x="91" y="36" width="18" height="18" rx="2" fill="oklch(0.84 0.04 175)" />
          <rect x="91" y="60" width="18" height="18" rx="2" fill="oklch(0.89 0.08 100)" />
        </g>
      ))}
    </svg>
  );
}
