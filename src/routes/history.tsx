import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, FileDown, History, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageContainer } from "@/components/shared/AppShell";
import { EmptyState } from "@/components/shared/States";
import { shareOrDownload } from "@/components/results/ScanResultView";
import { localHistory } from "@/services/localHistory";
import { formatCaptured, levelName } from "@/services/summary";
import type { Scan } from "@/types/scan";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Saved scans — StripGuide" },
      { name: "description", content: "Scans you chose to save, stored only on this device." },
      { property: "og:title", content: "Saved scans — StripGuide" },
      { property: "og:description", content: "Local-only, opt-in history of screening estimates." },
    ],
  }),
  component: HistoryPage,
});

export function useHistory() {
  const [items, setItems] = useState<Scan[] | null>(null);
  useEffect(() => {
    const load = () => setItems(localHistory.list());
    load();
    window.addEventListener("stripguide-history", load);
    return () => window.removeEventListener("stripguide-history", load);
  }, []);
  return items;
}

function HistoryPage() {
  const items = useHistory();
  const navigate = useNavigate();
  return (
    <PageContainer narrow>
      <h1 className="text-3xl font-bold">Saved scans</h1>
      <p className="mt-2 text-muted-foreground">Stored only in this browser. Not a medical record.</p>
      <div className="mt-6">
        {items === null ? null : items.length === 0 ? (
          <EmptyState icon={History} title="No saved scans yet" action={<Button asChild><Link to="/scan">Scan one strip</Link></Button>}>
            You can use StripGuide without saving anything.
          </EmptyState>
        ) : (
          <ul className="space-y-3">
            {items.map((s) => (
              <li key={s.id} className="card-surface flex items-center gap-4 p-4">
                {s.image ? <img src={s.image} alt="" className="h-14 w-14 rounded-md border object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-md bg-muted"><History className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" /></span>}
                <div className="min-w-0 flex-1">
                  <p className="tabular font-semibold">{formatCaptured(s.createdAt)}</p>
                  <p className="truncate text-sm text-muted-foreground">Pad A: {levelName(s, "pad-a")} · Pad B: {levelName(s, "pad-b")}</p>
                  <p className="text-sm text-muted-foreground">Photo quality: {s.quality.label}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Scan options"><MoreHorizontal strokeWidth={1.5} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate({ to: "/results", search: { id: s.id } })}><Eye className="h-4 w-4" strokeWidth={1.5} /> View</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => shareOrDownload(s)}><FileDown className="h-4 w-4" strokeWidth={1.5} /> Export summary</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onSelect={() => localHistory.remove(s.id)}><Trash2 className="h-4 w-4" strokeWidth={1.5} /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
