import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge, TierBadge } from "@/components/status-badge";
import {
  formatCurrency,
  formatDate,
  formatPct,
  TIER_OPTIONS,
} from "@/lib/format";
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  Hash,
  Upload,
  FileText,
  Download,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const DOC_CATEGORIES = [
  { value: "contract", label: "Contract" },
  { value: "compliance", label: "Compliance" },
  { value: "identity", label: "Identity / KYC" },
  { value: "tax", label: "Tax / W-9" },
  { value: "creative", label: "Creative sample" },
  { value: "other", label: "Other" },
];

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
  const qc = useQueryClient();

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

  // Load affiliate managers (profiles that hold the affiliate_manager role)
  const { data: ams } = useQuery({
    queryKey: ["affiliate-managers"],
    queryFn: async () => {
      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "affiliate_manager");
      if (rErr) throw rErr;
      const ids = Array.from(new Set(roles.map((r) => r.user_id)));
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      if (error) throw error;
      return data;
    },
  });

  const updatePublisher = useMutation({
    mutationFn: async (patch: { tier?: string; assigned_am?: string | null }) => {
      const { error } = await supabase
        .from("publishers")
        .update(patch as never)
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["publisher", p.id] });
      qc.invalidateQueries({ queryKey: ["publishers"] });
      toast.success("Publisher updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignedAm = ams?.find((a) => a.id === p.assigned_am) ?? null;

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
      </div>

      {/* Assignment controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Tier
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Manually classify this publisher's performance tier.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <Select
              value={p.tier}
              onValueChange={(v) => updatePublisher.mutate({ tier: v })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TierBadge tier={p.tier} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Dedicated Affiliate Manager
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {assignedAm
              ? `Currently managed by ${assignedAm.full_name ?? assignedAm.email}`
              : "No AM assigned yet."}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Select
              value={p.assigned_am ?? "__none__"}
              onValueChange={(v) =>
                updatePublisher.mutate({ assigned_am: v === "__none__" ? null : v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Assign AM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {(ams ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.full_name ?? a.email ?? a.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
                  : p.traffic_sources.map((s: string) => (
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

        {/* Timeline */}
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

      {/* Compliance / Documents */}
      <ComplianceSection publisherId={p.id} />
    </div>
  );
}

function ComplianceSection({ publisherId }: { publisherId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("compliance");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (file && !name) setName(file.name);
  }, [file, name]);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["publisher-documents", publisherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("publisher_documents")
        .select("*")
        .eq("publisher_id", publisherId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setFile(null);
    setName("");
    setDescription("");
    setCategory("compliance");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Select a file first");
      return;
    }
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id ?? null;
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${publisherId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("publisher-documents")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("publisher_documents").insert({
        publisher_id: publisherId,
        name: name || file.name,
        description: description || null,
        category,
        file_path: path,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by: userId,
      });
      if (insErr) throw insErr;

      toast.success("Document uploaded");
      resetForm();
      qc.invalidateQueries({ queryKey: ["publisher-documents", publisherId] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string, displayName: string) => {
    const { data, error } = await supabase.storage
      .from("publisher-documents")
      .createSignedUrl(filePath, 60);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to get download link");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = displayName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    const { error: sErr } = await supabase.storage
      .from("publisher-documents")
      .remove([filePath]);
    if (sErr) {
      toast.error(sErr.message);
      return;
    }
    const { error } = await supabase
      .from("publisher_documents")
      .delete()
      .eq("id", docId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Document deleted");
    qc.invalidateQueries({ queryKey: ["publisher-documents", publisherId] });
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div>
            <p className="text-sm font-semibold">Compliance</p>
            <p className="text-xs text-muted-foreground">
              Review publisher documents, contracts, KYC and creative samples.
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {docs?.length ?? 0} document{(docs?.length ?? 0) === 1 ? "" : "s"}
        </span>
      </div>

      {/* Upload */}
      <div className="grid gap-3 border-b border-border p-5 md:grid-cols-[1fr_1fr_180px_auto]">
        <div className="space-y-1.5 md:col-span-1">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            File
          </label>
          <Input
            ref={fileRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Document name
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Signed IO — Q3"
          />
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Category
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={handleUpload} disabled={uploading || !file} className="w-full md:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
        <div className="md:col-span-4">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes for the compliance team…"
            rows={2}
          />
        </div>
      </div>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-5 py-2.5 text-left font-medium">Document</th>
              <th className="px-3 py-2.5 text-left font-medium">Category</th>
              <th className="px-3 py-2.5 text-left font-medium">Size</th>
              <th className="px-3 py-2.5 text-left font-medium">Uploaded</th>
              <th className="px-5 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Loading documents…
                </td>
              </tr>
            )}
            {!isLoading && (docs?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No documents uploaded yet.
                </td>
              </tr>
            )}
            {(docs ?? []).map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                <td className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{d.name}</p>
                      {d.description && (
                        <p className="text-xs text-muted-foreground">{d.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {DOC_CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                  {formatBytes(d.file_size)}
                </td>
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {formatDate(d.created_at)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(d.file_path, d.name)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(d.id, d.file_path)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatBytes(bytes: number | null | undefined) {
  const n = Number(bytes ?? 0);
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
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
