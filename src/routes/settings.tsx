import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageContainer } from "@/components/shared/AppShell";
import { localHistory } from "@/services/localHistory";
import { FEEDBACK_URL } from "@/config/app";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ACR Strip Reader" },
      { name: "description", content: "Manage saved scans in ACR Strip Reader." },
      { property: "og:title", content: "Settings — ACR Strip Reader" },
      { property: "og:description", content: "Manage saved scans in ACR Strip Reader." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = () => setCount(localHistory.list().length);
    load();
    window.addEventListener("acr-history", load);
    return () => window.removeEventListener("acr-history", load);
  }, []);

  return (
    <PageContainer narrow>
      <h1 className="text-3xl">Settings</h1>
      <section className="card-surface mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="text-lg">Saved scans</h2>
          <p className="tabular text-muted-foreground">{count}</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={count === 0}><Trash2 strokeWidth={1.5} /> Delete all</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all saved scans?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { localHistory.clear(); toast.success("Saved scans deleted"); }}>Delete all</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
      {FEEDBACK_URL && (
        <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:underline">Send feedback</a>
      )}
    </PageContainer>
  );
}
