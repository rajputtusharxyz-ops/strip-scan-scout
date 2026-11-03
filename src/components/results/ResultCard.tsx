import type { ReferencePad } from "@/types/referenceConfig";
import type { PadResult } from "@/types/scan";

export function ResultCard({ pad, result, validated }: { pad: ReferencePad; result: PadResult; validated: boolean }) {
  const level = pad.levels.find((l) => l.id === result.resultLevel);
  return (
    <article className="card-surface flex flex-col p-5" data-testid={`result-${pad.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{pad.label}</h3>
          <p className="text-sm text-muted-foreground">{pad.description}</p>
        </div>
        <span className="h-10 w-10 shrink-0 rounded-md border" style={{ backgroundColor: result.sampledColor }} role="img" aria-label={`Sampled pad colour ${result.sampledColor}`} />
      </div>
      <p className="mt-5 font-heading text-2xl font-bold">{level ? level.displayName : "No reliable estimate"}</p>
      <dl className="tabular mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[0.95rem]">
        <dt className="text-muted-foreground">Colour match</dt>
        <dd className="font-semibold">{result.matchConfidence != null ? `${result.matchConfidence}%` : "–"}</dd>
        <dt className="text-muted-foreground">Confirmed reference</dt>
        <dd className="font-semibold">{validated ? "Yes" : "No"}</dd>
      </dl>
      <p className="mt-4 border-t pt-3 text-sm text-muted-foreground">{level?.explanatoryText ?? "The colour did not match the reference closely enough. Compare with your strip chart."}</p>
    </article>
  );
}
