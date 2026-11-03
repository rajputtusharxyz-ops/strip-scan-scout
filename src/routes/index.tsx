import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, Eye, Lock, ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { StripIllustration } from "@/components/shared/StripIllustration";
import { localHistory } from "@/services/localHistory";
import { formatCaptured } from "@/services/summary";
import type { Scan } from "@/types/scan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StripGuide — Read one test strip with more confidence" },
      { name: "description", content: "Photograph one two-pad urine test strip, check photo quality, confirm the pads and see an educational screening estimate." },
      { property: "og:title", content: "StripGuide — Read one test strip with more confidence" },
      { property: "og:description", content: "A careful, on-device companion for reading one test strip. Not a diagnosis." },
    ],
  }),
  component: Home,
});

function Home() {
  const [last, setLast] = useState<Scan | undefined>();
  useEffect(() => setLast(localHistory.list()[0]), []);

  return (
    <PageContainer>
      <section className="grid items-center gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
            <ScanLine className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden="true" /> Demo mode · one strip per photo
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] md:text-[3.25rem]">Read one test strip with more confidence.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Use your phone to capture the two colour pads, review the image quality, and see an educational screening estimate.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan one strip</Link></Button>
            <Link to="/guide" className="inline-flex min-h-11 items-center gap-1.5 px-1 font-semibold text-primary hover:underline">
              See the step-by-step guide <ArrowRight className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Not a diagnosis or a replacement for the strip instructions.</p>
        </div>
        <div className="mx-auto w-full max-w-xs md:max-w-sm">
          <StripIllustration className="w-full" />
        </div>
      </section>

      {last && (
        <section className="card-surface mt-10 flex flex-wrap items-center justify-between gap-3 p-5" aria-label="Last saved scan">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Last saved scan</p>
            <p className="tabular font-semibold">{formatCaptured(last.createdAt)}</p>
            <p className="text-sm text-muted-foreground">Photo quality: {last.quality.label}</p>
          </div>
          <Button variant="outline" asChild><Link to="/results" search={{ id: last.id }}>View</Link></Button>
        </section>
      )}

      <section className="mt-12 grid gap-4 md:grid-cols-3" aria-label="How StripGuide protects you">
        {[
          { icon: ScanLine, t: "One strip at a time", d: "A single, clearly framed strip gives the most reliable colour comparison." },
          { icon: Eye, t: "You review before results", d: "Check the photo and confirm both pad outlines before anything is read." },
          { icon: Lock, t: "Saved only if you choose", d: "Photos are processed on this device and forgotten unless you save them." },
        ].map((c) => (
          <div key={c.t} className="card-surface p-5">
            <c.icon className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold">{c.t}</h2>
            <p className="mt-1 text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </section>

      <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> Demo configuration — not validated for clinical use.
      </p>
    </PageContainer>
  );
}
