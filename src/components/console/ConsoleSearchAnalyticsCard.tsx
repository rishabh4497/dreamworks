import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import { ConsoleHorizontalBar } from "@/components/console/ConsoleHorizontalBar";
import { Search, AlertTriangle, MousePointerClick } from "lucide-react";
import type { SearchAnalyticsReport } from "@/lib/types";

interface Props {
  report: SearchAnalyticsReport;
}

export function ConsoleSearchAnalyticsCard({ report }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={Search} label="Queries" value={report.totalQueries.toLocaleString()} />
        <ConsoleKpiTile icon={Search} label="Unique" value={report.uniqueQueries.toLocaleString()} />
        <ConsoleKpiTile
          icon={AlertTriangle}
          label="Zero-result rate"
          value={`${report.zeroResultPct.toFixed(1)}%`}
          tone={report.zeroResultPct > 15 ? "negative" : "default"}
        />
        <ConsoleKpiTile
          icon={MousePointerClick}
          label="Search → click"
          value={`${report.searchToViewPct.toFixed(1)}%`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Top queries</p>
          <ConsoleHorizontalBar
            data={report.topQueries.map((q) => ({ name: q.term, count: q.count }))}
            colorVar="--acid"
          />
        </Card>
        <Card className="p-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">
            Top zero-result queries — catalog gaps
          </p>
          <ConsoleHorizontalBar data={report.topZeroResultQueries} colorVar="--red" />
        </Card>
      </div>
    </div>
  );
}
