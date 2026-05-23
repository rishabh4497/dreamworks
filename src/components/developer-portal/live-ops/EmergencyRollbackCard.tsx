import { useMemo, useState } from "react";
import { AlertOctagon, ShieldOff, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { useApp } from "@/hooks/use-apps";
import { useAppBuilds, useSetBranchLive } from "@/hooks/use-app-builds";
import type { AppBuild } from "@/lib/types";

export function EmergencyRollbackCard({ appId }: { appId: string }) {
  const appQ = useApp(appId);
  const buildsQ = useAppBuilds(appId);
  const setLive = useSetBranchLive(appId);
  const [confirming, setConfirming] = useState(false);

  const defaultBranch = appQ.data?.branches.find((b) => b.name === "default");
  const currentBuildId = defaultBranch?.liveBuildId;

  // Builds are already returned newest-first by listBuilds.
  const builds: AppBuild[] = buildsQ.data ?? [];
  const previousBuild = useMemo(() => {
    if (!currentBuildId) return builds[1] ?? null;
    const idx = builds.findIndex((b) => b.id === currentBuildId);
    if (idx < 0) return builds[0] ?? null;
    return builds[idx + 1] ?? null;
  }, [builds, currentBuildId]);

  const handleRollback = async () => {
    if (!previousBuild) return;
    try {
      await setLive.mutateAsync({ branch: "default", buildId: previousBuild.id });
      toast.success(`Default branch reverted to ${previousBuild.buildLabel}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Rollback failed.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red/10">
          <AlertOctagon className="h-5 w-5 text-red" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Emergency rollback</h3>
          <p className="text-[12px] text-muted/60">
            One-click revert the default branch to the previous build. Use when a release ships a
            blocking bug.
          </p>
        </div>
      </header>

      <div className="space-y-2 rounded-xl border border-separator bg-input/40 p-3 text-[12px]">
        <Row label="Live now" value={currentBuildLabel(builds, currentBuildId)} />
        <Row label="Will revert to" value={previousBuild?.buildLabel ?? "— no prior build"} />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        {confirming ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRollback}
              disabled={!previousBuild || setLive.isPending}
            >
              <ShieldOff className="h-4 w-4" />
              {setLive.isPending ? "Reverting…" : `Revert to ${previousBuild?.buildLabel ?? "—"}`}
            </Button>
          </>
        ) : (
          <Button
            variant="danger"
            onClick={() => setConfirming(true)}
            disabled={!previousBuild}
          >
            <Undo2 className="h-4 w-4" /> Roll back default branch
          </Button>
        )}
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted/65">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function currentBuildLabel(builds: AppBuild[], id: string | undefined): string {
  if (!id) return "—";
  const match = builds.find((b) => b.id === id);
  return match?.buildLabel ?? id;
}
