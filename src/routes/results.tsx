import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Camera, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { EmptyState } from "@/components/shared/States";
import { ScanResultView } from "@/components/results/ScanResultView";
import { runAnalysis, useScanSession } from "@/services/scanSession";
import { localHistory } from "@/services/localHistory";
import type { Scan } from "@/types/scan";

export const Route = createFileRoute("/results")({
  validateSearch: (s: Record<string, unknown>): { id?: string } => (typeof s.id === "string" ? { id: s.id } : {}),
  head: () => ({
    meta: [
      { title: "Result — ACR Strip Reader" },
      { name: "description", content: "Albumin, creatinine and ACR screening estimate from one test strip photo, with safety guidance." },
      { property: "og:title", content: "Result — ACR Strip Reader" },
      { property: "og:description", content: "An educational, non-diagnostic screening estimate." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { id } = Route.useSearch();
  const session = useScanSession();
  const [saved, setSaved] = useState<Scan | undefined | null>(null);
  useEffect(() => setSaved(id ? localHistory.get(id) : undefined), [id]);

  if (id && saved === null) return null;
  const scan = id ? saved : session.result;

  return (
    <PageContainer narrow>
      {scan ? (
        <ScanResultView key={scan.id} scan={scan} saved={!!id} onRetry={id ? undefined : () => { runAnalysis().catch(() => {}); }} />
      ) : (
        <EmptyState icon={FileSearch} title="No result" action={<Button asChild><Link to="/scan"><Camera strokeWidth={1.5} /> Scan strip</Link></Button>} />
      )}
    </PageContainer>
  );
}
