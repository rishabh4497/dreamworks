import {
  Activity,
  AlertTriangle,
  Bug,
  Clock,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTelemetryScaffold, resolveLabel } from "@/hooks/use-config";

// Lucide icon registry. The config doc carries `meta.icon` as a kebab-case
// name; we map it to the actual component here so the bundle ships only the
// icons we reference.
const ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  cpu: Cpu,
  "alert-triangle": AlertTriangle,
  activity: Activity,
  bug: Bug,
};

export function TelemetryScaffoldCard() {
  const { data: items = [] } = useTelemetryScaffold();
  return (
    <Card className="p-5">
      <header className="mb-4">
        <h3 className="text-[14px] font-semibold text-foreground">Telemetry (coming soon)</h3>
        <p className="text-[12px] text-muted/60">
          Connect the Dreamworks SDK in your game build to start receiving session, hardware, and
          crash telemetry. These cards light up automatically once events arrive.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const meta = item.meta as
            | { icon?: string; description?: { en: string } & Record<string, string> }
            | undefined;
          const Icon = (meta?.icon && ICONS[meta.icon]) || Activity;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-dashed border-separator p-4"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted/60" />
                <span className="text-[12px] font-semibold text-foreground/85">
                  {resolveLabel(item.labels)}
                </span>
              </div>
              {meta?.description && (
                <p className="mt-1.5 text-[11px] text-muted/55">
                  {resolveLabel(meta.description)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
