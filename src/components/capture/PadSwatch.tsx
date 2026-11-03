import { useEffect, useRef } from "react";
import type { Bounds } from "@/types/scan";

/** Enlarged crop of the selected pad region. */
export function PadSwatch({ image, bounds, label }: { image: string; bounds: Bounds; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = ref.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, bounds.x * img.naturalWidth, bounds.y * img.naturalHeight, bounds.width * img.naturalWidth, bounds.height * img.naturalHeight, 0, 0, c.width, c.height);
    };
    img.src = image;
  }, [image, bounds.x, bounds.y, bounds.width, bounds.height]);
  return (
    <figure className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <canvas ref={ref} width={96} height={96} className="h-16 w-16 rounded-md border" aria-label={`Zoomed preview of ${label}`} role="img" />
      <figcaption>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">Should show only the coloured pad.</p>
      </figcaption>
    </figure>
  );
}
