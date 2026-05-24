import { useState } from "react";
import { Beaker, Pause, Play, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCreateExperiment,
  useDeleteExperiment,
  useExperimentResult,
  useExperiments,
  useUpdateExperiment,
} from "@/hooks/use-console-advanced";
import type { ConsoleRange } from "@/lib/types";

interface Props {
  range: ConsoleRange;
}

export function ConsoleExperimentList({ range }: Props) {
  const { data: experiments = [] } = useExperiments();
  const create = useCreateExperiment();
  const update = useUpdateExperiment();
  const del = useDeleteExperiment();
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : "anon";
  const [selected, setSelected] = useState<string | null>(experiments[0]?.id ?? null);
  const activeId = selected ?? experiments[0]?.id ?? null;
  const { data: result } = useExperimentResult(activeId ?? undefined, range);
  const active = experiments.find((e) => e.id === activeId);

  async function createExample() {
    await create.mutateAsync({
      flagKey: `flag-${Date.now()}`,
      name: "New experiment",
      status: "draft",
      variants: [
        { id: "control", name: "Control", allocationPct: 50 },
        { id: "variant", name: "Variant", allocationPct: 50 },
      ],
      primaryMetric: "checkout_complete",
      conversionWindowHours: 24,
      ownerUid: uid,
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-widest text-muted/55">Experiments</p>
          <button
            type="button"
            onClick={() => void createExample()}
            className="rounded-md bg-acid px-2 py-1 text-[10.5px] font-semibold text-background hover:bg-acid/80"
          >
            <Plus className="-mt-0.5 mr-0.5 inline h-3 w-3" />
            New
          </button>
        </div>
        <ul className="space-y-1">
          {experiments.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setSelected(e.id)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-card-hover ${
                  activeId === e.id ? "bg-card-active text-foreground" : "text-muted/75"
                }`}
              >
                <span className="truncate">{e.name}</span>
                <Badge variant={e.status === "running" ? "free" : e.status === "draft" ? "default" : "warn"}>
                  {e.status}
                </Badge>
              </button>
            </li>
          ))}
          {experiments.length === 0 && (
            <li className="py-3 text-center text-[11px] text-muted/45">No experiments yet</li>
          )}
        </ul>
      </Card>

      <Card className="p-4">
        {active ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/45">
                  <Beaker className="h-3 w-3" />
                  Flag · {active.flagKey}
                </p>
                <h3 className="mt-0.5 text-[14px] font-semibold text-foreground">{active.name}</h3>
                <p className="mt-0.5 text-[11.5px] text-muted/60">
                  Primary metric: <span className="text-foreground/70">{active.primaryMetric}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                {active.status === "running" ? (
                  <button
                    type="button"
                    onClick={() => update.mutate({ id: active.id, patch: { status: "paused" } })}
                    className="rounded-md bg-input p-1.5 text-foreground/80 hover:bg-card-hover"
                  >
                    <Pause className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      update.mutate({
                        id: active.id,
                        patch: { status: "running", startedAt: new Date().toISOString() },
                      })
                    }
                    className="rounded-md bg-acid p-1.5 text-background hover:bg-acid/80"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => del.mutate(active.id)}
                  className="rounded-md p-1.5 text-red hover:bg-red/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {result ? (
              <div className="grid gap-3 md:grid-cols-2">
                {result.variants.map((v) => (
                  <div key={v.variantId} className="rounded-lg border border-separator bg-input p-3">
                    <p className="text-[11px] uppercase tracking-widest text-muted/55">{v.variantName}</p>
                    <p className="mt-1 text-[20px] font-semibold text-foreground tabular-nums">
                      {v.conversionPct.toFixed(2)}%
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted/60">
                      {v.conversions} / {v.exposures} converted
                    </p>
                    {v.variantId !== result.variants[0]?.variantId && (
                      <p
                        className={`mt-2 text-[11.5px] font-semibold ${
                          v.liftVsControl >= 0 ? "text-green" : "text-red"
                        }`}
                      >
                        {v.liftVsControl >= 0 ? "+" : ""}
                        {(v.liftVsControl * 100).toFixed(1)}% vs control
                      </p>
                    )}
                    <p className="mt-1 text-[10.5px] text-muted/45">
                      P(best) = {Math.round(v.probabilityBest * 100)}%
                    </p>
                  </div>
                ))}
                <div className="rounded-lg border border-separator bg-input p-3 md:col-span-2">
                  <p className="text-[11px] uppercase tracking-widest text-muted/55">Significance</p>
                  <p className="mt-1 text-[13px] text-foreground/85">
                    p = <span className="tabular-nums">{result.pValue.toFixed(3)}</span> ·{" "}
                    {result.daysToSignificance === 0 ? "ready" : `${result.daysToSignificance}d to 95% power`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-[12px] text-muted/45">No exposures yet.</p>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-[12px] text-muted/45">Pick an experiment.</p>
        )}
      </Card>
    </div>
  );
}
