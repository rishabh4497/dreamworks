import { LayoutDashboard, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import {
  useCreateDashboard,
  useDashboards,
  useDeleteDashboard,
} from "@/hooks/use-console-advanced";

export function ConsoleDashboardList() {
  const { data: dashboards = [] } = useDashboards();
  const create = useCreateDashboard();
  const del = useDeleteDashboard();
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : "anon";

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/55">
          <LayoutDashboard className="h-3 w-3" />
          Custom dashboards
        </p>
        <button
          type="button"
          onClick={() =>
            create.mutate({
              name: "New dashboard",
              tiles: [],
              ownerUid: uid,
              shared: false,
            })
          }
          className="rounded-md bg-acid px-2 py-1 text-[10.5px] font-semibold text-background hover:bg-acid/80"
        >
          <Plus className="-mt-0.5 mr-0.5 inline h-3 w-3" /> New
        </button>
      </div>
      <ul className="space-y-2">
        {dashboards.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-card p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-medium text-foreground/85">{d.name}</p>
              <p className="mt-0.5 text-[11px] text-muted/60">
                {d.tiles.length} tile{d.tiles.length === 1 ? "" : "s"}
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
        {dashboards.length === 0 && (
          <li className="py-4 text-center text-[11.5px] text-muted/45">No dashboards yet.</li>
        )}
      </ul>
    </Card>
  );
}
