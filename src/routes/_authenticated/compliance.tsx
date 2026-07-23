import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance — Affiliate Automation" },
      { name: "description", content: "Creative compliance review and validation." },
      { property: "og:title", content: "Compliance — Affiliate Automation" },
      { property: "og:description", content: "Creative compliance review and validation." },
    ],
  }),
  component: () => (
    <StubPage
      section="Assets"
      title="Compliance"
      icon={ShieldCheck}
      description="Validate creatives against campaign compliance guidelines with a live review timer."
      features={[
        "Review queue with SLA countdown per submission",
        "In-platform chat between AM and compliance team",
        "Approval status logs and audit trail",
        "Ping + email notifications on decisions",
      ]}
    />
  ),
});
