import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/creative")({
  head: () => ({
    meta: [
      { title: "Creative Hub — Affiliate Automation" },
      { name: "description", content: "Central library for creatives and landing pages." },
      { property: "og:title", content: "Creative Hub — Affiliate Automation" },
      { property: "og:description", content: "Central library for creatives and landing pages." },
    ],
  }),
  component: () => (
    <StubPage
      section="Assets"
      title="Creative & Lander Hub"
      icon={ImageIcon}
      description="Single library for creatives and landing pages, organized by offer, GEO and vertical."
      features={[
        "Store ads, banners and copies organized by campaign",
        "Track approval status: approved, pending, rejected",
        "Central lander repository, in-house and external",
        "AI-assisted retrieval by prompt",
      ]}
    />
  ),
});
