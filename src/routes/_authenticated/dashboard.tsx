import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatNumber, formatPct } from "@/lib/format";
import { StatusBadge, TierBadge } from "@/components/status-badge";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  AlertCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Affiliate Automation" },
      { name: "description", content: "Overview of publishers, revenue and pipeline health." },
      { property: "og:title", content: "Dashboard — Affiliate Automation" },
      { property: "og:description", content: "Overview of publishers, revenue and pipeline health." },
    ],
  }),
  component: DashboardPage,
});

const REV_TREND = [
  { d: "W1", rev: 182_400 },
  { d: "W2", rev: 214_120 },
  { d: "W3", rev: 198_700 },
  { d: "W4", rev: 241_900 },
  { d: "W5", rev: 268_400 },
  { d: "W6", rev: 251_200 },
  { d: "W7", rev: 294_300 },
  { d: "W8", rev: 318_900 },
];

const TRAFFIC_MIX = [
  { source: "Email", rev: 412_300 },
  { source: "Search", rev: 386_100 },
  { source: "Display", rev: 214_800 },
  { source: "Social", rev: 152_200 },
  { source: "Native", rev: 121_600 },
  { source: "Push", rev: 68_400 },
];

function DashboardPage() {
  const { data: pubs } = useQuery({
    queryKey: ["dashboard-publishers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishers")
        .select(
          "id, company_name, partner_id, status, tier, revenue_30d, conversion_rate, performance_score",
        )
        .order("revenue_30d", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totals = (pubs ?? []).reduce(
    (acc, p) => {
      acc.rev30 += Number(p.revenue_30d);
      if (p.status === "active") acc.active += 1;
      if (p.status === "testing") acc.testing += 1;
      if (p.status === "blacklisted") acc.flagged += 1;
      return acc;
    },
    { rev30: 0, active: 0, testing: 0, flagged: 0 },
  );

  const topPublishers = (pubs ?? []).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live view of publisher performance and pipeline health.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Everflow synced 2 min ago
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue (30d)"
          value={formatCurrency(totals.rev30)}
          delta="+12.4%"
          trend="up"
          icon={DollarSign}
        />
        <KpiCard
          label="Active publishers"
          value={formatNumber(totals.active)}
          delta="+3"
          trend="up"
          icon={Users}
        />
        <KpiCard
          label="In testing"
          value={formatNumber(totals.testing)}
          delta="—"
          trend="flat"
          icon={Target}
        />
        <KpiCard
          label="Compliance flags"
          value={formatNumber(totals.flagged)}
          delta="-1"
          trend="down"
          icon={AlertCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Weekly revenue
              </p>
              <p className="metric-value mt-1 text-2xl font-semibold">
                {formatCurrency(REV_TREND.reduce((s, d) => s + d.rev, 0))}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3 w-3" /> +18.2%
            </div>
          </div>
          <div className="mt-6 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REV_TREND}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Area type="monotone" dataKey="rev" stroke="var(--color-primary)" strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Traffic mix (30d)
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRAFFIC_MIX} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                <YAxis type="category" dataKey="source" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={60} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => formatCurrency(v)}
                />
                <Bar dataKey="rev" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top publishers */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-sm font-semibold">Top publishers</p>
            <p className="text-xs text-muted-foreground">By 30-day revenue</p>
          </div>
          <Link
            to="/publishers"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-5 py-2 text-left font-medium">Publisher</th>
              <th className="px-5 py-2 text-left font-medium">Status</th>
              <th className="px-5 py-2 text-left font-medium">Tier</th>
              <th className="px-5 py-2 text-right font-medium">Rev / 30d</th>
              <th className="px-5 py-2 text-right font-medium">CVR</th>
              <th className="px-5 py-2 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {topPublishers.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                <td className="px-5 py-3">
                  <Link
                    to="/publishers/$id"
                    params={{ id: p.id }}
                    className="font-medium hover:text-primary"
                  >
                    {p.company_name}
                  </Link>
                  <div className="font-mono text-[11px] text-muted-foreground">{p.partner_id}</div>
                </td>
                <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-3"><TierBadge tier={p.tier} /></td>
                <td className="px-5 py-3 text-right metric-value">{formatCurrency(p.revenue_30d)}</td>
                <td className="px-5 py-3 text-right metric-value">{formatPct(p.conversion_rate)}</td>
                <td className="px-5 py-3 text-right metric-value font-semibold">{p.performance_score}</td>
              </tr>
            ))}
            {topPublishers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Loading publishers…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const trendColor =
    trend === "up"
      ? "text-primary"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : ArrowUpRight;
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="metric-value mt-3 text-2xl font-semibold">{value}</p>
      <p className={`mt-2 flex items-center gap-1 text-xs ${trendColor}`}>
        {trend !== "flat" && <TrendIcon className="h-3 w-3" />}
        <span>{delta}</span>
        <span className="text-muted-foreground">vs last period</span>
      </p>
    </div>
  );
}
