import { useState } from "react";
import { ShieldAlert, Trash2, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import {
  useDeleteMaintenanceWindow,
  useMaintenanceByApp,
  useSaveMaintenanceWindow,
} from "@/hooks/use-maintenance";
import { activeWindow } from "@/lib/api/maintenance";
import { formatDate } from "@/lib/utils";

function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MaintenanceWindowCard({ appId }: { appId: string }) {
  const list = useMaintenanceByApp(appId);
  const save = useSaveMaintenanceWindow();
  const del = useDeleteMaintenanceWindow(appId);

  const now = new Date();
  const inAnHour = new Date(now.getTime() + 60 * 60 * 1000);
  const [startsAt, setStartsAt] = useState(toLocalInput(now.toISOString()));
  const [endsAt, setEndsAt] = useState(toLocalInput(inAnHour.toISOString()));
  const [reason, setReason] = useState("Scheduled server maintenance");
  const [regionsCsv, setRegionsCsv] = useState("global");

  const live = activeWindow(list.data ?? []);

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        appId,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        reason,
        affectedRegions: regionsCsv
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      toast.success("Maintenance window scheduled.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Wrench className="h-4 w-4 text-orange" /> Maintenance windows
          </h3>
          <p className="text-[12px] text-muted/60">
            Schedule downtime. Active windows show as a banner on your game page.
          </p>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-orange">
            <ShieldAlert className="h-3.5 w-3.5" /> Live now
          </span>
        )}
      </header>

      <div className="mb-4 rounded-xl border border-separator bg-input/30 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          Schedule window
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-[11px] text-muted/65">
            Starts
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <label className="text-[11px] text-muted/65">
            Ends
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason"
            className="md:col-span-2"
          />
          <Input
            value={regionsCsv}
            onChange={(e) => setRegionsCsv(e.target.value)}
            placeholder="Regions, comma-separated (e.g. global or US-EAST,EU-WEST)"
            className="md:col-span-2"
          />
          <div className="md:col-span-2 flex items-center justify-end">
            <Button onClick={handleSave} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Schedule"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {list.isLoading && <p className="text-[12px] text-muted/55">Loading…</p>}
        {!list.isLoading && (list.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
            No maintenance windows scheduled.
          </p>
        )}
        {(list.data ?? []).map((w) => (
          <div
            key={w.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-separator bg-input/40 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-foreground">{w.reason}</p>
              <p className="mt-0.5 text-[11px] text-muted/65">
                {formatDate(w.startsAt)} → {formatDate(w.endsAt)} ·{" "}
                {w.affectedRegions.join(", ")}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => del.mutate(w.id)} aria-label="Delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
