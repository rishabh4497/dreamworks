import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, FileBarChart2, FileText, Search } from "lucide-react";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { ConsoleAnnotationsManager } from "@/components/console/ConsoleAnnotationsManager";
import { ConsoleSavedViews } from "@/components/console/ConsoleSavedViews";
import { ConsoleInsightsFeed } from "@/components/console/ConsoleInsightsFeed";
import { cn } from "@/lib/utils";

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  href?: string;
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "weekly-health",
    title: "Weekly platform health digest",
    description: "DAU, errors, revenue, top issues — bundled for the Monday standup.",
    href: "/console?tab=overview&range=7d",
  },
  {
    id: "growth-ops",
    title: "Top growth opportunities",
    description: "Apps with high wishlist counts but low purchase conversion.",
    href: "/console?tab=creators&sub=studios",
  },
  {
    id: "at-risk-users",
    title: "At-risk users",
    description: "Power users last seen 14+ days ago. Worth a re-engagement push.",
    href: "/console?tab=people&sub=users",
  },
  {
    id: "stuck-review",
    title: "Studios stuck in review",
    description: "Submissions pending for 14+ days; admin moderation backlog.",
    href: "/console?tab=creators&sub=studios",
  },
  {
    id: "high-refund",
    title: "Publishers above refund threshold",
    description: "Anyone over 5% refund rate gets a yellow flag.",
    href: "/console?tab=creators&sub=publishers",
  },
  {
    id: "low-conversion",
    title: "Wishlist conversion < industry benchmark",
    description: "Apps converting below the 5–10% Steam benchmark.",
    href: "/console?tab=creators&sub=studios",
  },
];

export function ConsoleReportsTab() {
  const [search, setSearch] = useState("");
  const filtered = TEMPLATES.filter(
    (t) =>
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
        <ConsoleSection
          title="Built-in templates"
          description="Pre-built reports admins reach for most"
          action={
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted/45" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates"
                className="w-56 rounded-md bg-input pl-7 pr-2 py-1 text-[12px] text-foreground placeholder:text-muted/50 outline-none focus:ring-1 focus:ring-acid/40"
              />
            </div>
          }
        >
          <div className="grid gap-2">
            {filtered.map((t) => (
              <Link
                key={t.id}
                to={t.href ?? "#"}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border border-separator bg-card p-3 transition-colors hover:bg-card-hover",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-acid/10 text-acid">
                    <FileBarChart2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground/90">{t.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted/60">{t.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted/50" />
              </Link>
            ))}
          </div>
        </ConsoleSection>

        <ConsoleSection title="Per-actor deep-dive reports">
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              to="/console?tab=people&sub=users"
              className="rounded-lg border border-separator bg-card p-4 transition-colors hover:bg-card-hover"
            >
              <FileText className="h-4 w-4 text-acid" />
              <p className="mt-2 text-[13px] font-semibold text-foreground/90">User report</p>
              <p className="mt-1 text-[11.5px] text-muted/60">
                Pick a user from the People tab to open a 360° report.
              </p>
            </Link>
            <Link
              to="/console?tab=creators&sub=studios"
              className="rounded-lg border border-separator bg-card p-4 transition-colors hover:bg-card-hover"
            >
              <FileText className="h-4 w-4 text-acid" />
              <p className="mt-2 text-[13px] font-semibold text-foreground/90">Studio report</p>
              <p className="mt-1 text-[11.5px] text-muted/60">
                Funnel quality, build cadence, time-to-publish, what to fix.
              </p>
            </Link>
            <Link
              to="/console?tab=creators&sub=publishers"
              className="rounded-lg border border-separator bg-card p-4 transition-colors hover:bg-card-hover"
            >
              <FileText className="h-4 w-4 text-acid" />
              <p className="mt-2 text-[13px] font-semibold text-foreground/90">Publisher report</p>
              <p className="mt-1 text-[11.5px] text-muted/60">
                ARPU / LTV, regional revenue, refund drivers, suggestions.
              </p>
            </Link>
          </div>
        </ConsoleSection>

        <ConsoleSection title="Insights feed" description="Auto-generated anomalies, opportunities, and regressions">
          <ConsoleInsightsFeed />
        </ConsoleSection>
      </div>

      <div className="space-y-6">
        <ConsoleAnnotationsManager />
        <ConsoleSavedViews />
      </div>
    </div>
  );
}
