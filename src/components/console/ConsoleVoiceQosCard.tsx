import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleSection } from "@/components/console/ConsoleSection";
import { Activity, Mic, Radio, Signal, Wifi } from "lucide-react";
import type { VoiceQosReport } from "@/lib/types";

interface Props {
  report: VoiceQosReport;
}

function mosTone(mos: number) {
  if (mos >= 4.2) return "positive" as const;
  if (mos >= 3.6) return "default" as const;
  return "negative" as const;
}

export function ConsoleVoiceQosCard({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile
          icon={Activity}
          label="Avg MOS"
          value={report.avgMos.toFixed(2)}
          tone={mosTone(report.avgMos)}
        />
        <ConsoleKpiTile
          icon={Wifi}
          label="Packet loss"
          value={`${report.packetLossPct.toFixed(2)}%`}
          tone={report.packetLossPct > 2 ? "negative" : "default"}
        />
        <ConsoleKpiTile
          icon={Signal}
          label="p95 jitter"
          value={`${Math.round(report.p95JitterMs)} ms`}
        />
        <ConsoleKpiTile
          icon={Radio}
          label="p95 RTT"
          value={`${Math.round(report.p95RttMs)} ms`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ConsoleSection title="Top channels by occupancy">
          <Card className="p-4">
            {report.topChannels.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted/55">No voice activity yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {report.topChannels.map((c) => (
                  <li
                    key={c.channelId}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="text-foreground/85">{c.name}</span>
                    <span className="tabular-nums text-muted/70">
                      {c.minutes} min · {c.users} users
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </ConsoleSection>
        <ConsoleSection title="Worst MOS — likely incidents">
          <Card className="p-4">
            {report.worstChannels.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted/55">No incidents.</p>
            ) : (
              <ul className="space-y-1.5">
                {report.worstChannels.map((c) => (
                  <li
                    key={c.channelId}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="flex items-center gap-1.5 text-foreground/85">
                      <Mic className="h-3 w-3 text-red/80" />
                      {c.name}
                    </span>
                    <span className="tabular-nums text-red/85">
                      MOS {c.mos.toFixed(1)} · loss {c.lossPct.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </ConsoleSection>
      </div>
    </div>
  );
}
