import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { StripIllustration } from "@/components/shared/StripIllustration";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cybow2AC Strip App — Read one strip with more confidence" },
      { name: "description", content: "Photograph one CYBOW 2AC strip and see an albumin, creatinine and ACR screening estimate. Not a diagnosis." },
      { property: "og:title", content: "Cybow2AC Strip App — Read one strip with more confidence" },
      { property: "og:description", content: "Albumin, creatinine and ACR screening estimates from one strip photo. Not a diagnosis." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <PageContainer>
      <section className="grid min-h-[60vh] items-center gap-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <h1 className="text-[2.6rem] leading-[1.08] md:text-[3.6rem]">Read one strip with more confidence.</h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Photograph one CYBOW 2AC strip to see an albumin, creatinine and ACR screening estimate.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button size="lg" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan one strip</Link></Button>
            <Link to="/guide" className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline-offset-4 hover:underline">How it works</Link>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[180px] md:max-w-[220px]">
          <StripIllustration className="w-full" />
        </div>
      </section>
      <p className="mt-16 text-sm text-muted-foreground">Screening estimate only — not a diagnosis or a replacement for the strip instructions.</p>
    </PageContainer>
  );
}
