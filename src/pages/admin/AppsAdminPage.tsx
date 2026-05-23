import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  Package,
  Pencil,
  Rocket,
  Search,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/common/EmptyState";
import { SubmissionStatusBadge } from "@/components/admin/SubmissionStatusBadge";
import { useAllApps, useDeleteAppAdmin } from "@/hooks/use-admin";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { App, AppStage, SubmissionStatus } from "@/lib/types";

const STAGE_OPTIONS: { value: AppStage | "all"; label: string }[] = [
  { value: "all", label: "All stages" },
  { value: "draft", label: "Draft" },
  { value: "in-review", label: "In review" },
  { value: "coming-soon", label: "Coming soon" },
  { value: "released", label: "Released" },
];

function stageVariant(stage: AppStage): "default" | "free" | "soon" | "warn" | "new" {
  switch (stage) {
    case "released":
      return "free";
    case "coming-soon":
      return "new";
    case "in-review":
      return "soon";
    case "draft":
    default:
      return "default";
  }
}

function formatPrice(cents: number): string {
  if (!Number.isFinite(cents)) return "—";
  if (cents === 0) return "Free";
  return `₹${(cents / 100).toFixed(2)}`;
}

function relativeTime(iso?: string): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function AppsAdminPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<AppStage | "all">("all");
  const { data, isLoading, error } = useAllApps({ stage, search });
  const deleteMutation = useDeleteAppAdmin();

  const [confirmDelete, setConfirmDelete] = useState<App | null>(null);
  const [alsoDeleteGame, setAlsoDeleteGame] = useState(true);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const stats = useMemo(() => {
    const byStage = new Map<AppStage, number>();
    (data ?? []).forEach((app) => byStage.set(app.stage, (byStage.get(app.stage) ?? 0) + 1));
    return byStage;
  }, [data]);

  const onConfirmDelete = async () => {
    if (!confirmDelete) return;
    try {
      const result = await deleteMutation.mutateAsync({
        appId: confirmDelete.id,
        alsoDeleteGame,
      });
      if (result.clientFallback) {
        toast.success(
          `Deleted ${confirmDelete.gameTitle}. (Submission history kept; deploy deleteAppAdmin function for a full server-side purge with audit.)`,
        );
      } else {
        toast.success(
          `Deleted ${confirmDelete.gameTitle} (${result.deletedSubmissions} submission${
            result.deletedSubmissions === 1 ? "" : "s"
          } purged${result.deletedGame ? ", store entry removed" : ""}).`,
        );
      }
      setConfirmDelete(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed.";
      console.error("deleteAppAdmin failed", err);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-[16px] font-semibold text-foreground">Apps</h2>
        <p className="max-w-3xl text-[12px] leading-relaxed text-muted/60">
          Every app in <code className="font-mono text-[11px] text-foreground/80">dw_apps</code>.
          Admins can edit any field (rules allow), publish released apps, or hard-delete
          (cascades to builds, achievements, submissions, and the store entry).
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/55" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title, slug, developer, publisher"
            className="h-9 w-full rounded-xl border border-separator bg-input pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
          />
        </div>
        <select
          value={stage}
          onChange={(event) => setStage(event.target.value as AppStage | "all")}
          className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15 sm:w-56"
        >
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
              {o.value !== "all" && stats.get(o.value as AppStage)
                ? ` (${stats.get(o.value as AppStage)})`
                : ""}
            </option>
          ))}
        </select>
      </div>

      {data && data.length > 0 && (
        <p className="text-[11px] text-muted/55">
          {data.length} app{data.length === 1 ? "" : "s"} match this filter.
        </p>
      )}

      {isLoading ? (
        <Card className="p-6 text-[13px] text-muted/65">Loading apps…</Card>
      ) : error ? (
        <Card className="p-6 text-[13px] text-red">
          Failed to load: {(error as Error).message}
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No apps found"
          description="No apps match the current filter."
        />
      ) : (
        <div className="space-y-2">
          {data.map((app) => (
            <AppRow
              key={app.id}
              app={app}
              onDelete={() => {
                setAlsoDeleteGame(app.stage === "released");
                setConfirmDelete(app);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => !deleteMutation.isPending && setConfirmDelete(null)}
        title="Delete app"
        maxWidth="max-w-md"
      >
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-[13px] text-foreground/85">
              Permanently delete{" "}
              <span className="font-semibold text-foreground">{confirmDelete.gameTitle}</span>?
            </p>
            <p className="text-[12px] text-muted/65">
              This cascades to builds, achievements, and submission history. Owner:{" "}
              <span className="font-mono text-foreground/80">{confirmDelete.ownerUserId}</span>.
            </p>
            <label className="flex items-start gap-2 rounded-lg bg-card-active/45 p-3 text-[12px]">
              <input
                type="checkbox"
                checked={alsoDeleteGame}
                onChange={(event) => setAlsoDeleteGame(event.target.checked)}
                className="mt-0.5"
              />
              <span className="text-foreground/85">
                Also remove the live store entry (
                <code className="font-mono text-[11px] text-foreground/70">
                  dw_games/{confirmDelete.id}
                </code>
                ). Recommended when the app was released.
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={onConfirmDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {deleteMutation.isPending ? "Deleting…" : "Delete permanently"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AppRow({ app, onDelete }: { app: App; onDelete: () => void }) {
  return (
    <Card className="p-3 transition-colors hover:bg-card-hover/50">
      <div className="flex items-center gap-4">
        {app.headerUrl || app.coverUrl ? (
          <img
            src={app.headerUrl ?? app.coverUrl}
            alt=""
            className="h-[68px] w-32 shrink-0 rounded-lg border border-separator bg-card-active object-cover"
          />
        ) : (
          <div className="flex h-[68px] w-32 shrink-0 items-center justify-center rounded-lg bg-card-active text-muted/45">
            <Package className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge variant={stageVariant(app.stage)}>{app.stage}</Badge>
            {app.submissionStatus && app.submissionStatus !== "none" && (
              <SubmissionStatusBadge status={app.submissionStatus as SubmissionStatus} />
            )}
          </div>
          <h3 className="truncate text-[14px] font-semibold text-foreground">
            {app.gameTitle}
          </h3>
          <p
            className={cn(
              "mt-0.5 truncate text-[12px]",
              app.shortDescription ? "text-muted/65" : "italic text-muted/40",
            )}
          >
            {app.shortDescription || "No short description yet."}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted/55">
            <span className="font-mono text-foreground/70">{app.id}</span>
            <span className="text-muted/35">·</span>
            <span>{formatPrice(app.basePriceCents)}</span>
            <span className="text-muted/35">·</span>
            <span>{app.platforms?.length ? app.platforms.join(", ") : "—"}</span>
            <span className="text-muted/35">·</span>
            <span>
              dev <span className="text-foreground/75">{app.developerIds?.[0] ?? "—"}</span>
            </span>
            <span className="text-muted/35">·</span>
            <span>
              pub <span className="text-foreground/75">{app.publisherIds?.[0] ?? "—"}</span>
            </span>
            <span className="text-muted/35">·</span>
            <span>updated {relativeTime(app.updatedAt)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {app.stage === "released" && (
            <Link
              to={ROUTES.gameDetail(app.id)}
              title="Open public store page"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-separator bg-card px-2.5 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground/85"
            >
              <Rocket className="h-3.5 w-3.5" />
              Store
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          )}
          <Link
            to={ROUTES.devAppStorePage(app.id)}
            title="Edit in the developer portal"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-separator bg-card px-2.5 text-[12px] font-medium text-foreground/85 hover:bg-card-active hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <button
            type="button"
            onClick={onDelete}
            title="Delete app and cascade"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red/25 bg-transparent px-2.5 text-[12px] font-medium text-red hover:bg-red/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </Card>
  );
}
