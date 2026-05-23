import { useState } from "react";
import { GitBranch, RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import { useApp } from "@/hooks/use-apps";
import { useAppBuilds, useSetBranchLive } from "@/hooks/use-app-builds";
import { formatDate } from "@/lib/utils";
import type { AppBranch, AppBuild } from "@/lib/types";

export function BranchManagerCard({ appId }: { appId: string }) {
  const appQ = useApp(appId);
  const buildsQ = useAppBuilds(appId);
  const setLive = useSetBranchLive(appId);
  const [pending, setPending] = useState<string | null>(null);

  const branches: AppBranch[] = appQ.data?.branches ?? [];
  const builds: AppBuild[] = buildsQ.data ?? [];
  const buildById = new Map(builds.map((b) => [b.id, b]));

  const handleSwitch = async (branch: string, buildId: string) => {
    setPending(`${branch}:${buildId}`);
    try {
      await setLive.mutateAsync({ branch, buildId });
      toast.success(`Branch "${branch}" → ${buildById.get(buildId)?.buildLabel ?? buildId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Switch failed.");
    } finally {
      setPending(null);
    }
  };

  return (
    <Card className="p-5">
      <header className="mb-4">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <GitBranch className="h-4 w-4 text-cyan" /> Branch manager
        </h3>
        <p className="text-[12px] text-muted/60">
          Set which build is live on each branch. Default goes to all players; beta is opt-in.
        </p>
      </header>

      {branches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
          No branches configured.
        </p>
      ) : (
        <div className="space-y-3">
          {branches.map((b) => {
            const live = b.liveBuildId ? buildById.get(b.liveBuildId) : null;
            return (
              <div
                key={b.name}
                className="rounded-xl border border-separator bg-input/40 p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground capitalize">{b.name}</p>
                    {b.description && (
                      <p className="text-[11px] text-muted/60">{b.description}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-muted/55">
                    Updated {formatDate(b.updatedAt)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-muted/65">Live:</span>
                  {live ? (
                    <span className="rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-green">
                      {live.buildLabel}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted/55">none</span>
                  )}
                  <select
                    className="ml-auto h-8 rounded-xl border border-separator bg-input px-2 text-[12px] text-foreground"
                    value={b.liveBuildId ?? ""}
                    onChange={(e) =>
                      e.target.value && void handleSwitch(b.name, e.target.value)
                    }
                    disabled={pending !== null}
                  >
                    <option value="" disabled>
                      Switch to…
                    </option>
                    {builds.map((build) => (
                      <option key={build.id} value={build.id}>
                        {build.buildLabel} ({build.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {builds.length === 0 && (
        <p className="mt-3 text-[11px] text-muted/55">
          Upload a build under the app's Builds tab to enable branch switches.
        </p>
      )}

      {pending && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted/70">
          <RotateCw className="h-3 w-3 animate-spin" /> Updating…
        </p>
      )}
    </Card>
  );
}
