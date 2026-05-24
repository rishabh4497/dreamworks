import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";
import type { CdnRegionReport } from "@/lib/types";

interface Props {
  regions: CdnRegionReport[];
}

export function ConsoleCdnMap({ regions }: Props) {
  if (regions.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No CDN data yet.</p>;
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {regions.map((r) => (
        <Card key={r.region} className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted/45">{r.region}</p>
              <p className="mt-0.5 text-[15px] font-semibold text-foreground/85">
                {formatBytes(r.totalBytes24h)} <span className="text-muted/55 text-[12px]">/ 24h</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-[11px] text-muted/70">
              <span>Active edges {r.activeNodes}</span>
              <span>p95 {r.p95LatencyMs} ms</span>
              <span>cache hit {r.avgCacheHitPct.toFixed(1)}%</span>
            </div>
          </div>
          <ul className="space-y-1.5 text-[11.5px]">
            {r.edges.slice(0, 8).map((e) => (
              <li key={e.nodeId} className="flex items-center justify-between gap-3">
                <span className="truncate text-foreground/85">{e.hostname || e.nodeId}</span>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <Badge variant={e.status === "online" ? "free" : e.status === "degraded" ? "soon" : "warn"}>
                    {e.status}
                  </Badge>
                  <span className="text-muted/65">{e.cacheHitPct.toFixed(0)}%</span>
                  <span className="text-muted/55">{e.p95LatencyMs}ms</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
