import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/funnel")({
  head: () => ({
    meta: [
      { title: "Funnel — Affiliate Automation" },
      { name: "description", content: "Publisher lifecycle from outreach to scaling." },
      { property: "og:title", content: "Funnel — Affiliate Automation" },
      { property: "og:description", content: "Publisher lifecycle from outreach to scaling." },
    ],
  }),
  component: () => (
    <StubPage
      section="Operations"
      title="Publisher Funnel"
      icon={Filter}
      description="Visualize the publisher journey from initial outreach to active revenue generation."
      features={[
        "Stages: Outreach → Signup → Approval → Testing → Cap → Active → Scaling",
        "Conversion rates between stages",
        "Time-in-stage and drop-off identification",
        "AI-assisted cap recommendation for testing stage",
      ]}
    />
  ),
});
