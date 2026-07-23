import { cn } from "@/lib/utils";
import { STATUS_LABELS, TIER_LABELS } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-primary/15 text-primary border-primary/30",
  testing: "bg-warning/15 text-warning border-warning/30",
  pending: "bg-muted text-muted-foreground border-border",
  paused: "bg-muted text-muted-foreground border-border",
  blacklisted: "bg-destructive/15 text-destructive border-destructive/30",
};

const TIER_STYLES: Record<string, string> = {
  tier_s: "bg-primary/15 text-primary border-primary/30",
  tier_a: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  tier_d: "bg-muted text-muted-foreground border-border",
  tier_1: "bg-primary/15 text-primary border-primary/30",
  tier_2: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  tier_3: "bg-muted text-muted-foreground border-border",
};


export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        TIER_STYLES[tier] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {TIER_LABELS[tier] ?? tier}
    </span>
  );
}
