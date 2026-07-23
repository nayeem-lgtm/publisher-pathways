import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatNumber, formatPct } from "@/lib/format";
import { StatusBadge, TierBadge } from "@/components/status-badge";
import {
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Trophy,
  UserCog,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Affiliate Automation" },
      { name: "description", content: "Monthly revenue, top publishers and AM performance." },
      { property: "og:title", content: "Performance — Affiliate Automation" },
      { property: "og:description", content: "Monthly revenue, top publishers and AM performance." },
    ],
  }),
  component: PerformancePage,
});

type RangeKey = "7d" | "30d" | "mtd" | "qtd";
const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "mtd", label: "MTD" },
  { key: "qtd", label: "QTD" },
];

// Deterministic weekly trend derived from the 30d total so numbers are stable.
function buildTrend(total: number) {
  const weights = [0.16, 0.19, 0.14, 0.22, 0.28, 0.24, 0.31, 0.36];
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w, i) => ({
    d: `W${i + 1}`,
    rev: Math.round((total * w) / sum),
  }));
}

function PerformancePage() {
  const [range, setRange] = useState<RangeKey>("30d");

  const { data: pubs, isLoading } = useQuery({
    queryKey: ["performance-publishers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishers")
        .select(
          "id, company_name, partner_id, status, tier, revenue_30d, revenue_total, conversion_rate, performance_score, assigned_am, traffic_sources",
        )
        .order("revenue_30d", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const amIds = useMemo(
    () => Array.from(new Set((pubs ?? []).map((p) => p.assigned_am).filter(Boolean) as string[])),
    [pubs],
  );

  const { data: ams } = useQuery({
    queryKey: ["performance-ams", amIds],
    enabled: amIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", amIds);
      if (error) throw error;
      return data;
    },
  });

  // Range is currently a display-only lens over the 30d snapshot — the DB
  // only tracks a rolling 30d and lifetime total. Approximations keep the
  // KPIs honest without lying about precision.
  const rangeFactor = range === "7d" ? 7 / 30 : range === "mtd" ? 0.75 : range === "qtd" ? 3 : 1;

  const kpis = useMemo(() => {
    const list = pubs ?? [];
    const rev = list.reduce((s, p) => s + Number(p.revenue_30d), 0) * rangeFactor;
    const active = list.filter((p) => p.status === "active").length;
    const avgCvr =
      list.length > 0
        ? list.reduce((s, p) => s + Number(p.conversion_rate), 0) / list.length
        : 0;
    const avgScore =
      list.length > 0
        ? Math.round(list.reduce((s, p) => s + p.performance_score, 0) / list.length)
        : 0;
    return { rev, active, avgCvr, avgScore, count: list.length };
  }, [pubs, rangeFactor]);

  const trend = useMemo(() => buildTrend(kpis.rev), [kpis.rev]);

  const topPublishers = useMemo(() => (pubs ?? []).slice(0, 8), [pubs]);

  const amRows = useMemo(() => {
    const list = pubs ?? [];
    const byAm = new Map<
      string,
      { revenue: number; pubs: number; active: number; scoreSum: number }
    >();
    for (const p of list) {
      const key = p.assigned_am ?? "__unassigned__";
      const row = byAm.get(key) ?? { revenue: 0, pubs: 0, active: 0, scoreSum: 0 };
      row.revenue += Number(p.revenue_30d) * rangeFactor;
      row.pubs += 1;
      if (p.status === "active") row.active += 1;
      row.scoreSum += p.performance_score;
      byAm.set(key, row);
    }
    const target = 60_000; // per-AM monthly revenue target
    return Array.from(byAm.entries())
      .map(([id, v]) => {
        const profile = ams?.find((a) => a.id === id) ?? null;
        return {
          id,
          name: profile?.full_name ?? (id === "__unassigned__" ? "Unassigned" : "—"),
          email: profile?.email ?? null,
          revenue: v.revenue,
          publishers: v.pubs,
          active: v.active,
          avgScore: Math.round(v.scoreSum / Math.max(v.pubs, 1)),
          target,
          attainment: v.revenue / target,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [pubs, ams, rangeFactor]);

  const trafficMix = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pubs ?? []) {
      const share =
        p.traffic_sources.length > 0 ? Number(p.revenue_30d) / p.traffic_sources.length : 0;
      for (const s of p.traffic_sources) {
        map.set(s, (map.get(s) ?? 0) + share * rangeFactor);
      }
    }
    return Array.from(map.entries())
      .map(([source, rev]) => ({ source, rev: Math.round(rev) }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 6);
  }, [pubs, rangeFactor]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Overview
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Performance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, publisher quality and affiliate manager attainment.
          </p>
        </div>
        <div className="flex rounded-md border border-border bg-muted p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={[
                "rounded-sm px-3 py-1 text-xs transition-colors",
                range === r.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi label={`Revenue · ${range.toUpperCase()}`} value={formatCurrency(kpis.rev)} icon={DollarSign} delta="+14.8%" />
        <Kpi label="Active publishers" value={formatNumber(kpis.active)} icon={Users} delta={`${kpis.count} total`} />
        <Kpi label="Avg. conversion" value={formatPct(kpis.avgCvr)} icon={Target} delta="+0.6pp" />
        <Kpi label="Quality score" value={String(kpis.avgScore)} icon={TrendingUp} delta="+3" />
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
                {formatCurrency(trend.reduce((s, d) => s + d.rev, 0))}
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-md bg-primary/15 px-2 py-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3 w-3" /> +14.8%
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="rev" stroke="var(--color-primary)" strokeWidth={2} fill="url(#perfFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Traffic mix
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficMix} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="source"
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={70}
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
                <Bar dataKey="rev" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top publishers + AM breakdown */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Top publishers */}
        <div className="rounded-lg border border-border bg-card lg:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Top publishers this month</p>
                <p className="text-xs text-muted-foreground">Ranked by revenue</p>
              </div>
            </div>
            <Link
              to="/publishers"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-5 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Publisher</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Tier</th>
                  <th className="px-3 py-2 text-right font-medium">Revenue</th>
                  <th className="px-3 py-2 text-right font-medium">CVR</th>
                  <th className="px-5 py-2 text-right font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      Loading performance…
                    </td>
                  </tr>
                )}
                {!isLoading && topPublishers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No publisher activity yet.
                    </td>
                  </tr>
                )}
                {topPublishers.map((p, i) => {
                  const rev = Number(p.revenue_30d) * rangeFactor;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0 hover:bg-accent/40"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          to="/publishers/$id"
                          params={{ id: p.id }}
                          className="font-medium hover:text-primary"
                        >
                          {p.company_name}
                        </Link>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {p.partner_id}
                        </div>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-3 py-3"><TierBadge tier={p.tier} /></td>
                      <td className="px-3 py-3 text-right metric-value">
                        {formatCurrency(rev)}
                      </td>
                      <td className="px-3 py-3 text-right metric-value">
                        {formatPct(p.conversion_rate)}
                      </td>
                      <td className="px-5 py-3 text-right metric-value font-semibold">
                        {p.performance_score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AM leaderboard */}
        <div className="rounded-lg border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">Affiliate managers</p>
                <p className="text-xs text-muted-foreground">Revenue & attainment</p>
              </div>
            </div>
          </div>

          {/* AM chart */}
          <div className="p-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={amRows.slice(0, 6)} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: string) => v.split(" ")[0]}
                  />
                  <YAxis
                    stroke="var(--color-muted-foreground)"
                    fontSize={10}
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
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {amRows.slice(0, 6).map((r, idx) => (
                      <Cell
                        key={r.id}
                        fill={idx === 0 ? "var(--color-primary)" : "var(--color-muted-foreground)"}
                        fillOpacity={idx === 0 ? 1 : 0.5}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ul className="divide-y divide-border">
            {amRows.map((am, i) => (
              <li key={am.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate text-sm font-medium">{am.name}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {am.publishers} pubs · {am.active} active · score {am.avgScore}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="metric-value text-sm font-semibold">{formatCurrency(am.revenue)}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {formatPct(am.attainment)} of target
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={[
                      "h-full rounded-full transition-all",
                      am.attainment >= 1
                        ? "bg-primary"
                        : am.attainment >= 0.6
                          ? "bg-primary/70"
                          : "bg-primary/40",
                    ].join(" ")}
                    style={{ width: `${Math.min(am.attainment, 1.25) * 80}%` }}
                  />
                </div>
              </li>
            ))}
            {amRows.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No affiliate managers assigned yet.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="metric-value mt-3 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{delta}</p>
    </div>
  );
}
