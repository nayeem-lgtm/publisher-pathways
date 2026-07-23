import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Radar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/outreach")({
  head: () => ({
    meta: [
      { title: "Outreach — Affiliate Automation" },
      { name: "description", content: "Track outreach activity and KPI scoring across channels." },
      { property: "og:title", content: "Outreach — Affiliate Automation" },
      { property: "og:description", content: "Track outreach activity and KPI scoring across channels." },
    ],
  }),
  component: () => (
    <StubPage
      section="Growth"
      title="Outreach"
      icon={Radar}
      description="Log outreach activity across LinkedIn, email and calls, and score AM performance automatically."
      features={[
        "Log messages, connections, follow-ups and calls per AM",
        "AI-based weekly / monthly scoring against target",
        "Track response, meetings booked and onboarded publishers",
        "Contribute to overall KPI performance",
      ]}
    />
  ),
});
