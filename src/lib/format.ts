export function formatCurrency(n: number | null | undefined) {
  const val = Number(n ?? 0);
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${val.toFixed(0)}`;
}

export function formatNumber(n: number | null | undefined) {
  return new Intl.NumberFormat("en-US").format(Number(n ?? 0));
}

export function formatPct(n: number | null | undefined) {
  return `${Number(n ?? 0).toFixed(2)}%`;
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  testing: "Testing",
  active: "Active",
  paused: "Paused",
  blacklisted: "Blacklisted",
};

export const TIER_LABELS: Record<string, string> = {
  tier_1: "Tier 1",
  tier_2: "Tier 2",
  tier_3: "Tier 3",
};
