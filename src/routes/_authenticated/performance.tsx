import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "@/components/stub-page";
import { GaugeCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/performance")({
  head: () => ({
    meta: [
      { title: "Performance — Affiliate Automation" },
      { name: "description", content: "Detailed revenue and performance tracking." },
      { property: "og:title", content: "Performance — Affiliate Automation" },
      { property: "og:description", content: "Detailed revenue and performance tracking." },
    ],
  }),
  component: () => (
    <StubPage
      section="Overview"
      title="Performance"
      icon={GaugeCircle}
      description="Deep-dive revenue and quality metrics across publishers, campaigns and AMs."
      features={[
        "Revenue per publisher, campaign and AM",
        "AM performance vs assigned targets",
        "Weekly aggregations into monthly reports",
        "Actual vs. target success rates",
      ]}
    />
  ),
});
