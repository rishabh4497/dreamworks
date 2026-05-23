import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ExternalLink, Rocket, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { useApp, usePublishApp, useSubmitApp } from "@/hooks/use-apps";
import { useAppBuilds } from "@/hooks/use-app-builds";

interface Gate {
  label: string;
  ok: boolean;
  hint?: string;
}

export function PublishPage() {
  const { appId = "" } = useParams();
  const navigate = useNavigate();
  const { data: app, isLoading } = useApp(appId);
  const { data: builds } = useAppBuilds(appId);
  const submit = useSubmitApp(appId);
  const publish = usePublishApp(appId);

  if (isLoading || !app) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading…</Card>;
  }

  const defaultBranch = app.branches.find((b) => b.name === "default");
  const liveBuild = defaultBranch?.liveBuildId
    ? (builds ?? []).find((b) => b.id === defaultBranch.liveBuildId)
    : undefined;

  const gates: Gate[] = [
    { label: "Game title set", ok: app.gameTitle.trim().length > 0 },
    { label: "Short description filled", ok: app.shortDescription.trim().length > 0 },
    {
      label: "At least 3 screenshots",
      ok: (app.screenshots?.length ?? 0) >= 3,
      hint: `${app.screenshots?.length ?? 0} so far`,
    },
    { label: "At least 1 trailer", ok: (app.trailers?.length ?? 0) >= 1 },
    { label: "Capsule art attached", ok: Boolean(app.capsuleUrl) },
    { label: "Header art attached", ok: Boolean(app.headerUrl) },
    {
      label: "Default branch has a live build",
      ok: Boolean(liveBuild),
      hint: liveBuild ? `live: ${liveBuild.buildLabel}` : "set in Builds & Branches",
    },
    { label: "Base price set (or marked free)", ok: app.basePriceCents >= 0 },
  ];

  const allReady = gates.every((g) => g.ok);

  const onSubmit = async () => {
    try {
      await submit.mutateAsync();
      toast.success("Submitted for review.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed.";
      toast.error(msg);
    }
  };

  const onPublish = async () => {
    try {
      await publish.mutateAsync();
      toast.success(`${app.gameTitle} is live in the store!`);
      navigate(ROUTES.gameDetail(app.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Publish failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-5">
        <header className="flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-foreground">Pre-flight checklist</h3>
          <Badge variant={allReady ? "free" : "soon"}>
            {allReady ? "All gates passing" : "Action needed"}
          </Badge>
        </header>
        <ul className="space-y-1.5">
          {gates.map((g) => (
            <li
              key={g.label}
              className="flex items-center gap-2 rounded-lg bg-card-active/45 px-3 py-2 text-[13px]"
            >
              {g.ok ? (
                <CheckCircle2 className="h-4 w-4 text-green" />
              ) : (
                <XCircle className="h-4 w-4 text-red" />
              )}
              <span className={g.ok ? "text-foreground" : "text-foreground/75"}>{g.label}</span>
              {g.hint && <span className="text-[11px] text-muted/60">— {g.hint}</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3 p-5">
        <h3 className="text-[16px] font-semibold text-foreground">Ship it</h3>
        <p className="text-[12px] text-muted/65">
          Submit for review when all gates pass; Dreamworks will check store-page presence and
          build integrity. Or publish now to push directly to the storefront — useful for testing.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={onSubmit}
            disabled={!allReady || submit.isPending || app.stage === "in-review"}
          >
            {app.stage === "in-review" ? "Already submitted" : "Submit for review"}
          </Button>
          <Button onClick={onPublish} disabled={!allReady || publish.isPending}>
            <Rocket className="h-4 w-4" />
            {publish.isPending ? "Publishing…" : "Publish now"}
          </Button>
          {app.stage === "released" && (
            <a
              href={ROUTES.gameDetail(app.id)}
              className="inline-flex items-center gap-1 text-[12px] text-acid hover:underline"
            >
              View on storefront <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </Card>
    </div>
  );
}
