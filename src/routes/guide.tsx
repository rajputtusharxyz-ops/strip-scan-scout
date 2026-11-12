import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, Check, X } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { SCAN_STEPS } from "@/config/app";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "Guide — ACR Strip Reader" },
      { name: "description", content: "Five steps to scan one strip, what makes a good photo, and three short answers." },
      { property: "og:title", content: "Guide — ACR Strip Reader" },
      { property: "og:description", content: "How to scan one strip with ACR Strip Reader." },
    ],
  }),
  component: GuidePage,
});

const GOOD = ["One strip", "Both pads visible", "Sharp focus", "Plain light background"];
const POOR = ["More than one strip", "Cropped pads", "Blur", "Strong shadow", "Cluttered background"];
export const FAQ: [string, string][] = [
  ["Can I scan more than one strip?", "No. Scan one strip at a time."],
  ["Why was my photo rejected?", "Both pads must be visible and in focus."],
  ["What happens after I take a photo?", "The app checks both pads before analysis."],
];

export function StepList() {
  return (
    <ol className="space-y-2">
      {SCAN_STEPS.map((s, i) => (
        <li key={s} className="card-surface flex items-center gap-4 px-4 py-3.5">
          <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

function GuidePage() {
  return (
    <PageContainer narrow>
      <h1 className="text-3xl">Guide</h1>
      <section className="mt-6"><StepList /></section>
      <section id="photo-tips" className="mt-10 scroll-mt-20 grid gap-3 sm:grid-cols-2" aria-label="Good photo and poor photo">
        <div className="card-surface p-5">
          <h2 className="text-lg">Good photo</h2>
          <ul className="mt-3 space-y-2">{GOOD.map((g) => <li key={g} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" strokeWidth={2} aria-hidden="true" />{g}</li>)}</ul>
        </div>
        <div className="card-surface p-5">
          <h2 className="text-lg">Poor photo</h2>
          <ul className="mt-3 space-y-2">{POOR.map((g) => <li key={g} className="flex gap-2"><X className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />{g}</li>)}</ul>
        </div>
      </section>
      <section className="mt-10" aria-labelledby="faq">
        <h2 id="faq" className="text-xl">Questions</h2>
        <Accordion type="single" collapsible className="card-surface mt-3 px-5">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-base font-medium">{q}</AccordionTrigger>
              <AccordionContent className="text-base">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
      <Button size="lg" className="mt-10" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan strip</Link></Button>
    </PageContainer>
  );
}
