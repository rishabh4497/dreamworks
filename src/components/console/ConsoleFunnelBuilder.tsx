import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { ConsoleFunnel } from "@/components/console/ConsoleFunnel";
import {
  useCreateFunnel,
  useDeleteFunnel,
  useFunnelEval,
  useFunnels,
} from "@/hooks/use-console-advanced";
import type { ConsoleRange, FunnelDefinition, FunnelStep } from "@/lib/types";

interface Props {
  range: ConsoleRange;
}

export function ConsoleFunnelBuilder({ range }: Props) {
  const { data: funnels = [] } = useFunnels();
  const create = useCreateFunnel();
  const del = useDeleteFunnel();
  const [selected, setSelected] = useState<string | null>(funnels[0]?.id ?? null);
  const [building, setBuilding] = useState(false);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<FunnelStep[]>([
    { event: "page_view", label: "Page view" },
  ]);
  const [hours, setHours] = useState(24);
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : "anon";
  const activeId = selected ?? funnels[0]?.id ?? null;
  const { data: result } = useFunnelEval(activeId ?? undefined, range);

  function addStep() {
    setSteps([...steps, { event: "page_view", label: `Step ${steps.length + 1}` }]);
  }
  function updateStep(i: number, patch: Partial<FunnelStep>) {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeStep(i: number) {
    setSteps(steps.filter((_, idx) => idx !== i));
  }
  async function save() {
    if (!name || steps.length < 2) return;
    const def: Omit<FunnelDefinition, "id" | "createdAt" | "updatedAt"> = {
      name,
      steps,
      windowHours: hours,
      ownerUid: uid,
    };
    await create.mutateAsync(def);
    setName("");
    setSteps([{ event: "page_view", label: "Page view" }]);
    setBuilding(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card className="p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-widest text-muted/55">Saved funnels</p>
          <button
            type="button"
            onClick={() => setBuilding((v) => !v)}
            className="rounded-md bg-acid px-2 py-1 text-[10.5px] font-semibold text-background hover:bg-acid/80"
          >
            <Plus className="-mt-0.5 mr-0.5 inline h-3 w-3" />
            New
          </button>
        </div>
        <ul className="space-y-1">
          {funnels.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setSelected(f.id)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-card-hover ${
                  activeId === f.id ? "bg-card-active text-foreground" : "text-muted/75"
                }`}
              >
                <span className="truncate">{f.name}</span>
                <span className="text-[10px] text-muted/40">{f.steps.length} steps</span>
              </button>
            </li>
          ))}
          {funnels.length === 0 && (
            <li className="py-3 text-center text-[11px] text-muted/45">No funnels yet</li>
          )}
        </ul>
        {activeId && (
          <button
            type="button"
            onClick={() => del.mutate(activeId)}
            className="mt-3 flex items-center gap-1 rounded-md px-2 py-1 text-[10.5px] text-red hover:bg-red/10"
          >
            <Trash2 className="h-3 w-3" />
            Delete selected
          </button>
        )}
      </Card>

      <div className="space-y-3">
        {building && (
          <Card className="p-4">
            <p className="mb-3 text-[11px] uppercase tracking-widest text-muted/55">New funnel</p>
            <div className="space-y-2">
              <input
                placeholder="Funnel name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md bg-input px-2 py-1.5 text-[12.5px] text-foreground outline-none focus:ring-1 focus:ring-acid/40"
              />
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="Label"
                    value={step.label}
                    onChange={(e) => updateStep(i, { label: e.target.value })}
                    className="flex-1 rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
                  />
                  <input
                    placeholder="event type"
                    value={step.event}
                    onChange={(e) => updateStep(i, { event: e.target.value })}
                    className="w-44 rounded-md bg-input px-2 py-1.5 text-[12px] text-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="rounded-md p-1.5 text-red hover:bg-red/10"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={addStep}
                  className="rounded-md bg-input px-2 py-1.5 text-[11px] text-muted/75 hover:bg-card-hover"
                >
                  + step
                </button>
                <label className="text-[11px] text-muted/55">
                  Window (h)
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="ml-2 w-16 rounded-md bg-input px-2 py-1 text-[11px] text-foreground outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-md bg-acid px-3 py-1.5 text-[11.5px] font-semibold text-background hover:bg-acid/80"
                >
                  Save funnel
                </button>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          {result ? (
            <div>
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-[14px] font-semibold text-foreground">
                  {funnels.find((f) => f.id === activeId)?.name ?? "Funnel"}
                </h3>
                <p className="text-[11px] text-muted/55">
                  median {result.medianCompletionSec}s · {result.totalUsers} users
                </p>
              </div>
              <ConsoleFunnel
                stages={result.stages.map((s) => ({
                  stage: s.label,
                  count: s.count,
                  pct: Math.round(s.pct),
                }))}
              />
            </div>
          ) : (
            <p className="py-6 text-center text-[12px] text-muted/45">
              Pick a funnel to see results.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
