import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { StripIllustration } from "@/components/shared/StripIllustration";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ACR Strip Reader — Read your strip with confidence" },
      { name: "description", content: "Capture one CYBOW 2AC strip to see albumin, creatinine and ACR screening estimates. Not a diagnosis." },
      { property: "og:title", content: "ACR Strip Reader — Read your strip with confidence" },
      { property: "og:description", content: "Albumin, creatinine and ACR screening estimates from one strip photo." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <PageContainer>
      <section className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <StripIllustration className="mb-8 h-28 w-auto" />
        <h1 className="text-[2rem] leading-tight md:text-[2.75rem]">Read your strip with confidence</h1>
        <p className="mt-3 text-lg text-muted-foreground">Capture one strip to begin</p>
        <Button size="lg" className="mt-8" asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan strip</Link></Button>
      </section>
    </PageContainer>
  );
}
