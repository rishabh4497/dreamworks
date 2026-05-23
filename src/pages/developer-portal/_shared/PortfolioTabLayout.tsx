import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ROUTES } from "@/lib/routes";
import { useMyApps } from "@/hooks/use-apps";
import { AppPicker, useSelectedAppId } from "./AppPicker";

interface PortfolioTabLayoutProps {
  /** Tab heading. */
  title: string;
  /** Short blurb under the heading. */
  description: string;
  /** Portfolio-level roll-up rendered above the picker. */
  portfolio?: ReactNode;
  /** Render the per-app sections; receives the selected app id (never undefined here). */
  renderApp: (selectedAppId: string) => ReactNode;
}

export function PortfolioTabLayout({
  title,
  description,
  portfolio,
  renderApp,
}: PortfolioTabLayoutProps) {
  const myApps = useMyApps();
  const apps = myApps.data ?? [];
  const { selectedId, setSelectedId } = useSelectedAppId(apps);

  if (myApps.isLoading) {
    return (
      <Card className="p-6 text-[13px] text-muted/65">Loading your apps…</Card>
    );
  }

  if (!apps.length) {
    return (
      <EmptyState
        icon={Package}
        title="No apps yet"
        description="Create your first app to unlock analytics, marketing, and live ops."
        action={
          <Link to={ROUTES.devAppNew}>
            <Button>Create your first app</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-[20px] font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 max-w-3xl text-[13px] text-muted/65">{description}</p>
      </header>

      {portfolio}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-separator bg-card p-3">
        <AppPicker apps={apps} value={selectedId} onChange={setSelectedId} />
        <p className="text-[11px] text-muted/55">
          {apps.length} {apps.length === 1 ? "app" : "apps"} in your portfolio
        </p>
      </div>

      {selectedId && renderApp(selectedId)}
    </div>
  );
}
