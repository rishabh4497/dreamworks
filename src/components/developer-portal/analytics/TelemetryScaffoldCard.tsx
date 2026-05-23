import { Activity, AlertOctagon, Bug, Cpu } from "lucide-react";
import { Card } from "@/components/ui/card";

const ITEMS = [
  {
    icon: Activity,
    label: "Session length distribution",
    description: "p50 / p95 / p99 session length, segmented by platform and region.",
  },
  {
    icon: Cpu,
    label: "Hardware mix",
    description: "GPU, CPU, RAM, and OS breakdown of your active player base.",
  },
  {
    icon: Bug,
    label: "Crash dumps",
    description: "Grouped by stack signature, with first/last seen and build version.",
  },
  {
    icon: AlertOctagon,
    label: "ANR / freeze rate",
    description: "Frames-dropped and main-thread stall events per session.",
  },
] as const;

export function TelemetryScaffoldCard() {
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
        {ITEMS.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-dashed border-separator p-4"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-muted/60" />
              <span className="text-[12px] font-semibold text-foreground/85">{item.label}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted/55">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
