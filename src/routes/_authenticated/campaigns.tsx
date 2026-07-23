import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Megaphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — Affiliate Automation" },
      { name: "description", content: "Campaign & offer workflow management." },
      { property: "og:title", content: "Campaigns — Affiliate Automation" },
      { property: "og:description", content: "Campaign & offer workflow management." },
    ],
  }),
  component: () => (
    <StubPage
      section="Operations"
      title="Campaigns"
      icon={Megaphone}
      description="Manage the campaign lifecycle between AMs, publishers and buyers."
      features={[
        "Sync offers from Everflow with allowed traffic and GEO rules",
        "Assign publishers to offers based on traffic profile",
        "Track workflow: assigned → testing → approved → active",
        "Creative submission, buyer approval and IO tracking",
      ]}
    />
  ),
});
