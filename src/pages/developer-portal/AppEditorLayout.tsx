import { NavLink, Outlet, useParams } from "react-router-dom";
import { Code2, FileText, Package, Trophy, Tag, Rocket, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import { useApp } from "@/hooks/use-apps";
import { cn } from "@/lib/utils";
import type { App } from "@/lib/types";

const SECTIONS = (id: string) => [
  { to: ROUTES.devAppStorePage(id), label: "Store Page", icon: FileText },
  { to: ROUTES.devAppBuilds(id), label: "Builds & Branches", icon: Package },
  { to: ROUTES.devAppAchievements(id), label: "Achievements", icon: Trophy },
  { to: ROUTES.devAppSdk(id), label: "SDK Integration", icon: Code2 },
  { to: ROUTES.devAppPricing(id), label: "Pricing", icon: Tag },
  { to: ROUTES.devAppPublish(id), label: "Publish", icon: Rocket },
];

function stageBadgeVariant(stage: App["stage"]) {
  if (stage === "released") return "free" as const;
  if (stage === "in-review") return "soon" as const;
  if (stage === "coming-soon") return "new" as const;
  return "default" as const;
}

function stageLabel(stage: App["stage"]) {
  if (stage === "released") return "Released";
  if (stage === "in-review") return "In Review";
  if (stage === "coming-soon") return "Coming Soon";
  return "Draft";
}

export function AppEditorLayout() {
  const { appId = "" } = useParams();
  const { data: app, isLoading } = useApp(appId);

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading app…</Card>;
  }
  if (!app) {
    return (
      <Card className="p-6 text-[13px] text-muted/65">
        App not found.{" "}
        <Link className="text-acid hover:underline" to={ROUTES.devApps}>
          Back to apps
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            to={ROUTES.devApps}
            className="inline-flex items-center gap-1 text-[12px] text-muted/60 hover:text-foreground/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All apps
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="truncate text-[20px] font-semibold tracking-tight text-foreground">
              {app.gameTitle}
            </h2>
            <Badge variant={stageBadgeVariant(app.stage)}>{stageLabel(app.stage)}</Badge>
          </div>
          <p className="mt-0.5 text-[11px] text-muted/55">
            {app.developerIds.join(", ")} · published by {app.publisherIds.join(", ")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        <nav className="space-y-1 self-start">
          {SECTIONS(appId).map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                  isActive
                    ? "bg-card-active text-foreground"
                    : "text-muted hover:bg-card-hover/50 hover:text-foreground/80",
                )
              }
            >
              <s.icon className="h-4 w-4 opacity-80" />
              {s.label}
            </NavLink>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
