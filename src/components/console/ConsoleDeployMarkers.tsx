import { useState } from "react";
import { GitCommit, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useCreateDeploy, useDeleteDeploy, useDeploys } from "@/hooks/use-console-advanced";
import { formatDate } from "@/lib/utils";

export function ConsoleDeployMarkers() {
  const { data: deploys = [] } = useDeploys();
  const create = useCreateDeploy();
  const del = useDeleteDeploy();
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : "anon";
  const [building, setBuilding] = useState(false);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/55">
          <GitCommit className="h-3 w-3" />
          Deploys
        </p>
        <button
          type="button"
          onClick={() => setBuilding((v) => !v)}
          className="rounded-md bg-acid px-2 py-1 text-[10.5px] font-semibold text-background hover:bg-acid/80"
        >
          <Plus className="-mt-0.5 mr-0.5 inline h-3 w-3" /> Mark
        </button>
      </div>

      {building && (
        <div className="mb-3 space-y-2 rounded-lg border border-separator bg-input p-3">
          <input
            placeholder="Version e.g. v0.6.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full rounded-md bg-card px-2 py-1.5 text-[12px] text-foreground outline-none"
          />
          <textarea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md bg-card px-2 py-1.5 text-[12px] text-foreground outline-none"
            rows={2}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (!version) return;
                await create.mutateAsync({
                  ts: new Date().toISOString(),
                  version,
                  notes: notes || undefined,
                  authorUid: uid,
                });
                setVersion("");
                setNotes("");
                setBuilding(false);
              }}
              className="rounded-md bg-acid px-3 py-1.5 text-[11.5px] font-semibold text-background hover:bg-acid/80"
            >
              Save deploy
            </button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {deploys.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-card p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-medium text-foreground/85">{d.version}</p>
              <p className="mt-0.5 text-[11px] text-muted/60">
                {formatDate(d.ts)}
                {d.notes && <> · {d.notes}</>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => del.mutate(d.id)}
              className="rounded-md p-1.5 text-red hover:bg-red/10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </li>
        ))}
        {deploys.length === 0 && (
          <li className="py-4 text-center text-[11.5px] text-muted/45">No deploys marked.</li>
        )}
      </ul>
    </Card>
  );
}
