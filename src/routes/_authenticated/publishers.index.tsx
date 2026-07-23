import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, TierBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatPct } from "@/lib/format";
import { Search, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/publishers/")({
  head: () => ({
    meta: [
      { title: "Publishers — Affiliate Automation" },
      { name: "description", content: "Manage the publisher database, tiers and traffic profiles." },
      { property: "og:title", content: "Publishers — Affiliate Automation" },
      { property: "og:description", content: "Manage the publisher database, tiers and traffic profiles." },
    ],
  }),
  component: PublishersList,
});

const STATUS_FILTERS = ["all", "active", "testing", "pending", "paused", "blacklisted"] as const;
const TIER_FILTERS = ["all", "tier_s", "tier_a", "tier_d"] as const;

function PublishersList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [tier, setTier] = useState<(typeof TIER_FILTERS)[number]>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["publishers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishers")
        .select("*")
        .order("revenue_30d", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return (data ?? []).filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (tier !== "all" && p.tier !== tier) return false;
      if (q) {
        const s = q.toLowerCase();
        if (
          !p.company_name.toLowerCase().includes(s) &&
          !p.partner_id.toLowerCase().includes(s) &&
          !(p.contact_name ?? "").toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [data, q, status, tier]);

  const stats = useMemo(() => {
    const list = data ?? [];
    return {
      total: list.length,
      active: list.filter((p) => p.status === "active").length,
      testing: list.filter((p) => p.status === "testing").length,
      rev30: list.reduce((s, p) => s + Number(p.revenue_30d), 0),
    };
  }, [data]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Operations
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Publishers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.total} publishers · {stats.active} active · {stats.testing} in testing ·{" "}
            {formatCurrency(stats.rev30)} rev / 30d
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>

      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, partner ID, contact…"
              className="h-9 pl-9"
            />
          </div>

          <FilterPills
            label="Status"
            options={STATUS_FILTERS.map((s) => ({ value: s, label: s === "all" ? "All" : s }))}
            value={status}
            onChange={(v) => setStatus(v as typeof status)}
          />
          <FilterPills
            label="Tier"
            options={TIER_FILTERS.map((s) => ({
              value: s,
              label: s === "all" ? "All" : s.replace("_", " "),
            }))}
            value={tier}
            onChange={(v) => setTier(v as typeof tier)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Publisher</th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
                <th className="px-3 py-2.5 text-left font-medium">Tier</th>
                <th className="px-3 py-2.5 text-left font-medium">Traffic</th>
                <th className="px-3 py-2.5 text-left font-medium">GEOs</th>
                <th className="px-3 py-2.5 text-right font-medium">Rev / 30d</th>
                <th className="px-3 py-2.5 text-right font-medium">CVR</th>
                <th className="px-3 py-2.5 text-right font-medium">Score</th>
                <th className="px-5 py-2.5 text-right font-medium">Onboarded</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Loading publishers…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No publishers match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <td className="px-5 py-3">
                    <Link
                      to="/publishers/$id"
                      params={{ id: p.id }}
                      className="font-medium hover:text-primary"
                    >
                      {p.company_name}
                    </Link>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {p.partner_id} · {p.contact_name ?? "—"}
                    </div>
                  </td>
                  <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-3"><TierBadge tier={p.tier} /></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.traffic_sources.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {p.geos.join(", ") || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right metric-value">
                    {formatCurrency(p.revenue_30d)}
                  </td>
                  <td className="px-3 py-3 text-right metric-value">{formatPct(p.conversion_rate)}</td>
                  <td className="px-3 py-3 text-right metric-value font-semibold">
                    {p.performance_score}
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                    {formatDate(p.onboarded_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex rounded-md border border-border bg-muted p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={[
              "rounded-sm px-2 py-1 text-xs capitalize transition-colors",
              value === o.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
