import { useRef } from "react";
import type { Bounds } from "@/types/scan";
import type { PadId } from "@/types/referenceConfig";

type Props = {
  image: string;
  bounds: Record<PadId, Bounds>;
  onChange: (b: Record<PadId, Bounds>) => void;
};

const MIN = 0.03;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function StripOverlayEditor({ image, bounds, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: PadId; mode: "move" | "resize"; sx: number; sy: number; start: Bounds } | null>(null);

  function update(id: PadId, b: Bounds) {
    const w = clamp(b.width, MIN, 1), h = clamp(b.height, MIN, 1);
    onChange({ ...bounds, [id]: { width: w, height: h, x: clamp(b.x, 0, 1 - w), y: clamp(b.y, 0, 1 - h) } });
  }

  function onDown(e: React.PointerEvent, id: PadId, mode: "move" | "resize") {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { id, mode, sx: e.clientX, sy: e.clientY, start: bounds[id] };
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current, el = ref.current;
    if (!d || !el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - d.sx) / r.width, dy = (e.clientY - d.sy) / r.height;
    if (d.mode === "move") update(d.id, { ...d.start, x: d.start.x + dx, y: d.start.y + dy });
    else update(d.id, { ...d.start, width: Math.min(d.start.width + dx, 1 - d.start.x), height: Math.min(d.start.height + dy, 1 - d.start.y) });
  }
  function onKey(e: React.KeyboardEvent, id: PadId) {
    const step = 0.01;
    const b = bounds[id];
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = map[e.key];
    if (!m) return;
    e.preventDefault();
    if (e.shiftKey) update(id, { ...b, width: Math.min(b.width + m[0], 1 - b.x), height: Math.min(b.height + m[1], 1 - b.y) });
    else update(id, { ...b, x: b.x + m[0], y: b.y + m[1] });
  }

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md touch-none select-none overflow-hidden rounded-xl border bg-card" onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
      <img src={image} alt="Your strip photo with the two detected pad areas outlined" className="block w-full" draggable={false} />
      {(["pad-a", "pad-b"] as PadId[]).map((id) => {
        const b = bounds[id];
        const label = id === "pad-a" ? "Pad A" : "Pad B";
        return (
          <div
            key={id}
            role="group"
            tabIndex={0}
            aria-label={`${label} outline. Use arrow keys to move, Shift plus arrow keys to resize.`}
            onKeyDown={(e) => onKey(e, id)}
            onPointerDown={(e) => onDown(e, id, "move")}
            className="absolute cursor-move rounded-sm border-2 border-primary bg-primary/15 transition-[box-shadow] duration-150 focus-visible:shadow-[0_0_0_3px_var(--color-card)]"
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.width * 100}%`, height: `${b.height * 100}%` }}
          >
            <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">{label}</span>
            <span
              aria-hidden="true"
              onPointerDown={(e) => onDown(e, id, "resize")}
              className="absolute -bottom-3 -right-3 h-6 w-6 cursor-nwse-resize rounded-full border-2 border-card bg-primary"
            />
          </div>
        );
      })}
    </div>
  );
}
