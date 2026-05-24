import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { MousePointerClick, TrendingUp } from "lucide-react";
import type { RecommendationCtrReport } from "@/lib/types";

interface Props {
  report: RecommendationCtrReport;
}

export function ConsoleRecCtrTable({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ConsoleKpiTile
          icon={TrendingUp}
          label="Total impressions"
          value={report.totalImpressions.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={MousePointerClick}
          label="Total clicks"
          value={report.totalClicks.toLocaleString()}
        />
        <ConsoleKpiTile
          icon={MousePointerClick}
          label="CTR"
          value={`${report.ctrPct.toFixed(2)}%`}
          tone={report.ctrPct >= 3 ? "positive" : "default"}
        />
      </div>
      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">By slot</p>
        {report.slots.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted/55">No impressions yet.</p>
        ) : (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
                <th className="text-left font-normal pb-1.5">Slot</th>
                <th className="text-right font-normal pb-1.5 pr-2">Impressions</th>
                <th className="text-right font-normal pb-1.5 pr-2">Clicks</th>
                <th className="text-right font-normal pb-1.5 pr-2">CTR</th>
                <th className="text-right font-normal pb-1.5">Avg pos</th>
              </tr>
            </thead>
            <tbody>
              {report.slots.map((s) => (
                <tr key={s.slot} className="border-t border-separator/50">
                  <td className="py-1.5 text-foreground/85">{s.slot}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{s.impressions}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{s.clicks}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/85">{s.ctrPct.toFixed(2)}%</td>
                  <td className="py-1.5 text-right tabular-nums text-muted/60">{s.avgPosition.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
