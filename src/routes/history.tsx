import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/AppShell";
import { localHistory } from "@/services/localHistory";
import { fmt, formatCaptured } from "@/services/summary";
import type { Scan } from "@/types/scan";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Saved scans — ACR Strip Reader" },
      { name: "description", content: "Scans you chose to save." },
      { property: "og:title", content: "Saved scans — ACR Strip Reader" },
      { property: "og:description", content: "Your saved albumin, creatinine and ACR estimates." },
    ],
  }),
  component: HistoryPage,
});

export function useHistory() {
  const [items, setItems] = useState<Scan[] | null>(null);
  useEffect(() => {
    const load = () => setItems(localHistory.list());
    load();
    window.addEventListener("acr-history", load);
    return () => window.removeEventListener("acr-history", load);
  }, []);
  return items;
}

const val = (n: number | null) => (n == null ? "–" : fmt(n));

function HistoryPage() {
  const items = useHistory();
  return (
    <PageContainer narrow>
      <h1 className="text-3xl">Saved scans</h1>
      <div className="mt-6">
        {items === null ? null : items.length === 0 ? (
          <p className="text-muted-foreground">No saved scans</p>
        ) : (
          <ul className="card-surface">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
                <div className="tabular min-w-0 flex-1">
                  <p className="font-medium">{formatCaptured(s.createdAt)}</p>
                  <p className="text-muted-foreground">
                    Albumin {val(s.analysis.albuminMgL)} mg/L · Creatinine {val(s.analysis.creatinineMgL)} mg/L · ACR {val(s.analysis.acr)} mg/g
                  </p>
                </div>
                <Button variant="ghost" size="icon" aria-label="Delete scan" onClick={() => localHistory.remove(s.id)}><Trash2 strokeWidth={1.5} /></Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
