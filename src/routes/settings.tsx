import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Database, Globe, MessageSquare, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageContainer } from "@/components/shared/AppShell";
import { localHistory } from "@/services/localHistory";
import { analysisServiceUrl } from "@/services/analysisApi";
import { FEEDBACK_URL } from "@/config/app";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Cybow2AC Strip App" },
      { name: "description", content: "Privacy controls, saved data and app information for Cybow2AC Strip App." },
      { property: "og:title", content: "Settings — Cybow2AC Strip App" },
      { property: "og:description", content: "Manage saved data and privacy for Cybow2AC Strip App." },
    ],
  }),
  component: SettingsPage,
});

function Row({ icon: Icon, title, children }: { icon: typeof Database; title: string; children: React.ReactNode }) {
  return (
    <section className="card-surface flex gap-4 p-5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-1 text-foreground/85">{children}</div>
      </div>
    </section>
  );
}

function SettingsPage() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = () => setCount(localHistory.list().length);
    load();
    window.addEventListener("stripguide-history", load);
    return () => window.removeEventListener("stripguide-history", load);
  }, []);

  return (
    <PageContainer narrow>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-6 space-y-3">
        <Row icon={Activity} title="Analysis service">
          <p data-testid="analysis-status">{analysisServiceUrl() ? "Analysis service active" : "Analysis service not connected"}</p>
          <p className="text-sm text-muted-foreground">The analysis method is fixed and maintained by the product team.</p>
        </Row>
        <Row icon={Globe} title="Language">
          <p>English. More languages are planned.</p>
        </Row>
        <Row icon={ShieldCheck} title="Privacy and safety">
          <p>When you start analysis, your photo is sent securely to the analysis service for that scan and is not saved by default. Nothing is kept on this device unless you choose to save it.</p>
          <Link to="/guide" hash="safety" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Read privacy and safety information</Link>
        </Row>
        <Row icon={Trash2} title="Delete all saved data">
          <p className="tabular">{count === 0 ? "Nothing is saved on this device." : `${count} saved scan${count === 1 ? "" : "s"} on this device.`}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="mt-3" disabled={count === 0}><Trash2 strokeWidth={1.5} /> Delete all saved data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all saved scans?</AlertDialogTitle>
                <AlertDialogDescription>This removes every saved result and photo from this browser. It cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { localHistory.clear(); toast.success("All saved data deleted."); }}>Delete all</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Row>
        <Row icon={MessageSquare} title="Feedback">
          <a href={FEEDBACK_URL} className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline">Send feedback</a>
        </Row>
      </div>
    </PageContainer>
  );
}
