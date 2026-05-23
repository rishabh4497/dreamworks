import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Package, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/lib/routes";
import { useMyApps } from "@/hooks/use-apps";
import { formatDate } from "@/lib/utils";
import type { App } from "@/lib/types";

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

export function AppListPage() {
  const { data, isLoading } = useMyApps();

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading apps…</Card>;
  }

  const apps = data ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold text-foreground">Your apps</h2>
        <Link to={ROUTES.devAppNew}>
          <Button>
            <Plus className="h-4 w-4" />
            New App
          </Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed bg-transparent p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-acid/10 text-acid">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">No apps yet</h3>
            <p className="mt-1 max-w-sm text-[13px] text-muted/65">
              Each app is one game in your catalog — its store page, builds, achievements, and
              pricing. Create your first to get started.
            </p>
          </div>
          <Link to={ROUTES.devAppNew} className="mt-2">
            <Button>
              <Plus className="h-4 w-4" />
              Create app
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apps.map((app) => (
            <Link
              key={app.id}
              to={ROUTES.devAppStorePage(app.id)}
              className="group overflow-hidden rounded-2xl border border-separator bg-card transition-all hover:border-acid/40 hover:shadow-[0_0_15px_rgba(204,255,0,0.1)]"
            >
              <div className="relative aspect-[460/215] w-full overflow-hidden bg-card-active/50">
                {app.headerUrl || app.coverUrl ? (
                  <img
                    src={app.headerUrl || app.coverUrl}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    alt={app.gameTitle}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted/30" />
                  </div>
                )}
                <div className="absolute right-2 top-2">
                  <Badge variant={stageBadgeVariant(app.stage)}>{stageLabel(app.stage)}</Badge>
                </div>
              </div>
              <div className="space-y-1 p-4">
                <h3 className="truncate text-[15px] font-semibold text-foreground">
                  {app.gameTitle || "Untitled"}
                </h3>
                <p className="truncate text-[12px] text-muted/70">
                  {app.genres.join(" · ") || "Uncategorized"}
                </p>
                <p className="mt-2 text-[10px] text-muted/50">
                  Updated {formatDate(app.updatedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
