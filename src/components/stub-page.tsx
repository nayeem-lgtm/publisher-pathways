import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function StubPage({
  section,
  title,
  icon: Icon,
  description,
  features,
}: {
  section: string;
  title: string;
  icon: LucideIcon;
  description: string;
  features: string[];
}) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {section}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card p-10">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-primary">
            Coming next
          </p>
          <h2 className="mt-2 text-lg font-semibold">{title} module</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This module is on the roadmap. Below is what's planned — tell me which slice to
            build next and I'll wire it up.
          </p>

          <ul className="mt-6 space-y-2 text-left text-sm">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
              >
                <Sparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
