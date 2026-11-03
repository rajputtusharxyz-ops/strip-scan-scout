import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary">
        <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      {children && <div className="mt-2 max-w-md text-muted-foreground">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-caution-border bg-caution-surface p-5">
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-caution" strokeWidth={1.5} aria-hidden="true" />
        <div>
          <h2 className="font-semibold">{title}</h2>
          {children && <div className="mt-1 text-foreground/85">{children}</div>}
          {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}

export function InlineHelp({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}
