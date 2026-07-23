import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Affiliate Automation" },
      { name: "description", content: "Platform configuration, integrations and roles." },
      { property: "og:title", content: "Settings — Affiliate Automation" },
      { property: "og:description", content: "Platform configuration, integrations and roles." },
    ],
  }),
  component: () => (
    <StubPage
      section="System"
      title="Settings"
      icon={SettingsIcon}
      description="Workspace configuration, integrations, users and role-based permissions."
      features={[
        "Roles: Affiliate Manager, QA, Compliance, Management",
        "Integration keys: Everflow, Ringba, LeadProsper",
        "Notification preferences (in-app + email)",
        "Data sync frequency",
      ]}
    />
  ),
});
