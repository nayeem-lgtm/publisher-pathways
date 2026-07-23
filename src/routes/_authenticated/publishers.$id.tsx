import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, TierBadge } from "@/components/status-badge";
import {
  formatCurrency,
  formatDate,
  formatPct,
} from "@/lib/format";
import { ArrowLeft, Mail, Building2, Calendar, Hash } from "lucide-react";

export const Route = createFileRoute("/_authenticated/publishers/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${(loaderData as { company_name: string }).company_name} — Publisher`
          : "Publisher — Affiliate Automation",
      },
      { name: "description", content: "Publisher profile with performance and compliance history." },
    ],
  }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("publishers")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
  component: PublisherDetail,
  notFoundComponent: () => (
    <div className="p-10 text-center text-sm text-muted-foreground">Publisher not found.</div>
  ),
});

function PublisherDetail() {
  const initial = Route.useLoaderData();
  const { data: p } = useQuery({
    queryKey: ["publisher", initial.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publishers")
        .select("*")
        .eq("id", initial.id)
        .maybeSingle();
      if (error) throw error;
      return data!;
    },
    initialData: initial,
  });

  return (
    <div className="p-6 space-y-6">
      <Link
        to="/publishers"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All publishers
      </Link>

      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">{p.company_name}</h1>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Hash className="h-3 w-3" /> {p.partner_id}
                  </span>
                  {p.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {p.email}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Onboarded {formatDate(p.onboarded_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={p.status} />
            <TierBadge tier={p.tier} />
          </div>
        </div>

        {p.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {p.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                {t.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MiniStat label="Revenue / 30d" value={formatCurrency(p.revenue_30d)} />
        <MiniStat label="Revenue total" value={formatCurrency(p.revenue_total)} />
        <MiniStat label="Conversion rate" value={formatPct(p.conversion_rate)} />
        <MiniStat label="Performance score" value={String(p.performance_score)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Profile detail */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-semibold">Traffic profile</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 p-5 text-sm">
            <Row label="Contact">{p.contact_name ?? "—"}</Row>
            <Row label="Email">{p.email ?? "—"}</Row>
            <Row label="Traffic sources">
              <div className="flex flex-wrap gap-1">
                {p.traffic_sources.length === 0
                  ? "—"
                  : p.traffic_sources.map((s) => (
                      <span
                        key={s}
                        className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
              </div>
            </Row>
            <Row label="GEOs">
              <span className="font-mono text-xs text-muted-foreground">
                {p.geos.join(", ") || "—"}
              </span>
            </Row>
            <Row label="Daily cap">
              <span className="metric-value">{p.cap_daily ?? "—"}</span>
            </Row>
            <Row label="Status">
              <StatusBadge status={p.status} />
            </Row>
          </dl>

          <div className="border-t border-border px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Notes
            </p>
            <p className="mt-2 text-sm text-foreground/90">
              {p.notes || "No notes yet."}
            </p>
          </div>
        </div>

        {/* Timeline placeholder */}
        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-semibold">Timeline</p>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </div>
          <ol className="relative m-5 space-y-5 border-l border-border pl-4">
            <TimelineItem
              date={formatDate(p.onboarded_at)}
              title="Onboarded"
              body="Publisher added to Everflow and assigned partner ID."
            />
            <TimelineItem
              date="2 weeks ago"
              title="Cap raised"
              body={`Daily cap adjusted to ${p.cap_daily ?? "—"} leads.`}
            />
            <TimelineItem
              date="Yesterday"
              title="Performance sync"
              body={`Revenue updated · ${formatCurrency(p.revenue_30d)} in the last 30 days.`}
            />
          </ol>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="metric-value mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function TimelineItem({ date, title, body }: { date: string; title: string; body: string }) {
  return (
    <li className="relative">
      <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-card" />
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {date}
      </p>
      <p className="mt-0.5 text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{body}</p>
    </li>
  );
}
