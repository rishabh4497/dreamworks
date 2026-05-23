import { ShieldAlert } from "lucide-react";
import { useMaintenanceByApp } from "@/hooks/use-maintenance";
import { activeWindow } from "@/lib/api/maintenance";

export function GameMaintenanceBanner({ appId }: { appId: string }) {
  const { data } = useMaintenanceByApp(appId);
  const live = activeWindow(data ?? []);
  if (!live) return null;

  const endsAt = new Date(live.endsAt);
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-orange/40 bg-orange/10 px-4 py-3 text-orange">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="text-[12px] leading-relaxed">
        <p className="font-semibold uppercase tracking-widest">Maintenance in progress</p>
        <p className="text-foreground/80">
          {live.reason} · {live.affectedRegions.join(", ")} · back online{" "}
          {endsAt.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
