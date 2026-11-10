import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, Eye, FlaskConical, Hourglass, ScanLine, Sun, Square, XCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { SafetyNotice, SAFETY_TEXT, WHEN_TO_GET_HELP } from "@/components/shared/SafetyNotice";
import { StripIllustration } from "@/components/shared/StripIllustration";

export const Route = createFileRoute("/guide")({
  head: () => ({
    meta: [
      { title: "How to use Cybow2AC Strip App — Step-by-step guide" },
      { name: "description", content: "Seven steps for photographing one test strip, photo tips, common issues, FAQs, safety and privacy." },
      { property: "og:title", content: "How to use Cybow2AC Strip App" },
      { property: "og:description", content: "Step-by-step guide, photo tips and FAQs for reading one test strip." },
    ],
  }),
  component: GuidePage,
});

const STEPS = [
  { icon: Square, t: "Prepare a clean, light surface.", d: "A white or light-grey table, sheet of paper or tray works well." },
  { icon: FlaskConical, t: "Perform the test exactly as stated on the strip packaging.", d: "Follow the manufacturer’s instructions for sample collection and dipping." },
  { icon: Hourglass, t: "Wait the manufacturer-specified reading time.", d: "[Placeholder: XX seconds] — replace with the validated time from your strip instructions." },
  { icon: ScanLine, t: "Lay down one strip with the two coloured pads visible.", d: "Keep other strips, the bottle and the colour chart out of the frame." },
  { icon: Sun, t: "Capture in bright, even, neutral light.", d: "Indirect daylight is best. No flash, no coloured bulbs." },
  { icon: Eye, t: "Confirm the pad outlines in the app.", d: "Each outline should cover only its coloured pad." },
  { icon: CheckCircle2, t: "Read the estimate and compare it with the manufacturer chart.", d: "The app’s result is a screening estimate, not a diagnosis." },
];

const ISSUES = [
  ["Yellow lighting", "Warm bulbs shift colours. Use daylight or a neutral white light."],
  ["Shadows", "Your hand or phone can shade the strip. Light from the side helps."],
  ["Direct flash", "Flash creates glare on the pads. Keep it off."],
  ["Out-of-date strips", "Expired or badly stored strips may not change colour correctly."],
  ["Wet pads", "Excess liquid reflects light. Follow the packaging on blotting the strip."],
  ["Wrong waiting time", "Colours keep changing. Read at the time stated in your instructions."],
  ["Several strips in frame", "Cybow2AC Strip App reads one strip per photo."],
  ["Colour chart in frame", "The chart’s colour blocks confuse pad detection. Keep it out of the photo."],
];

const FAQ = [
  ["Can I scan more than one strip?", "No. Version 1 supports one strip per image so each reading is clear and traceable."],
  ["Does this replace lab testing?", "No. Cybow2AC Strip App shows an educational screening estimate. It does not replace laboratory testing, a validated reader or a clinician."],
  ["Why was my photo rejected?", "The quality check looks for one strip, both pads, sharp focus, even neutral light, no glare and a plain background. The rejection message names the exact reason and how to fix it."],
  ["Where is my photo stored?", "During a scan, only in this browser tab’s memory. It is forgotten when you refresh or close the page, unless you choose to save it on this device."],
];

function GuidePage() {
  return (
    <PageContainer narrow>
      <h1 className="text-3xl font-semibold md:text-4xl">How to use Cybow2AC Strip App</h1>
      <SafetyNotice className="mt-5" title="Placeholder content">
        The timing and interpretation below are placeholders until your CYBOW 2AC instructions are added and validated.
      </SafetyNotice>

      <section className="mt-10" aria-labelledby="steps">
        <h2 id="steps" className="text-2xl font-semibold">Step by step</h2>
        <ol className="mt-6">
          {STEPS.map((s, i) => (
            <li key={s.t} className="relative flex gap-4 pb-7 last:pb-0">
              {i < STEPS.length - 1 && <span aria-hidden="true" className="absolute left-5 top-11 h-[calc(100%-2.75rem)] w-px bg-border" />}
              <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full border-[1.5px] border-primary bg-card">
                <s.icon className="h-5 w-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="pt-1.5">
                <p className="font-semibold"><span className="tabular text-muted-foreground">{i + 1}.</span> {s.t}</p>
                <p className={`mt-0.5 ${s.d.startsWith("[Placeholder") ? "font-medium text-caution" : "text-foreground/80"}`}>{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="photo-tips" className="mt-12 scroll-mt-20" aria-labelledby="photos">
        <h2 id="photos" className="text-2xl font-semibold">Good photo / poor photo</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {([["good", "Good: one strip, even light", true], ["warm", "Poor: yellow light", false], ["shadow", "Poor: heavy shadow", false], ["multiple", "Poor: several strips", false]] as const).map(([v, l, ok]) => (
            <figure key={v} className="card-surface p-2">
              <StripIllustration variant={v} className="w-full" />
              <figcaption className="mt-2 flex items-center gap-1.5 px-1 text-sm font-medium">
                {ok ? <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={1.5} aria-hidden="true" /> : <XCircle className="h-4 w-4 text-caution" strokeWidth={1.5} aria-hidden="true" />} {l}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mt-12" aria-labelledby="issues">
        <h2 id="issues" className="text-2xl font-semibold">Common issues</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {ISSUES.map(([t, d]) => (
            <div key={t} className="rounded-lg border bg-card p-4">
              <dt className="font-semibold">{t}</dt>
              <dd className="text-[0.95rem] text-foreground/80">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card-surface mt-12 p-5" aria-labelledby="pads">
        <h2 id="pads" className="text-xl font-semibold">About the two pads</h2>
        <p className="mt-1 text-sm font-semibold text-caution">Placeholder</p>
        <p className="mt-2 leading-relaxed">CYBOW 2AC is commonly described as a two-parameter strip. It has an albumin pad and a creatinine pad. Cybow2AC Strip App estimates both concentrations in mg/L and the albumin-to-creatinine ratio (ACR). It does not label results as normal or abnormal.</p>
      </section>

      <section className="mt-12" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-semibold">Frequently asked questions</h2>
        <Accordion type="single" collapsible className="mt-4 card-surface px-5">
          {FAQ.map(([q, a]) => (
            <AccordionItem key={q} value={q}>
              <AccordionTrigger className="text-left text-base font-semibold">{q}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-foreground/85">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section id="safety" className="mt-12 scroll-mt-20 space-y-3" aria-labelledby="safety-h">
        <h2 id="safety-h" className="text-2xl font-semibold">Safety and privacy</h2>
        <SafetyNotice title="Screening estimate only.">{SAFETY_TEXT}</SafetyNotice>
        <SafetyNotice variant="urgent-placeholder" title="When to get help">{WHEN_TO_GET_HELP}</SafetyNotice>
        <SafetyNotice variant="standard" title="Privacy">When you start analysis, your photo is sent securely to the analysis service for that scan and is not saved by default. Nothing is kept on this device unless you choose to save it. Cybow2AC Strip App never asks for your name, date of birth, patient number or location. Browser storage is not a substitute for a medical record.</SafetyNotice>
      </section>

      <Button size="lg" className="mt-10 w-full sm:w-auto" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan one strip</Link></Button>
    </PageContainer>
  );
}
