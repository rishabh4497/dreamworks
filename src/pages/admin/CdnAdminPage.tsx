import { useMemo } from "react";
import { Activity, Globe2, HardDrive, Layers, Radio, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart-container";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { AdminKpiCard } from "@/components/admin/AdminKpiCard";
import {
  useCdnNodes,
  useDeltaPatches,
  useDistributionStats,
  useSetCdnNodeStatus,
} from "@/hooks/use-cdn";
import { cn, formatBytes } from "@/lib/utils";
import type { CdnNodeStatus } from "@/lib/types";

const STATUS_STYLES: Record<CdnNodeStatus, string> = {
  online: "bg-green/15 text-green",
  degraded: "bg-orange/15 text-orange",
  offline: "bg-red/15 text-red",
  maintenance: "bg-muted/15 text-muted",
};

const STATUS_LABELS: Record<CdnNodeStatus, string> = {
  online: "Online",
  degraded: "Degraded",
  offline: "Offline",
  maintenance: "Maintenance",
};

const REGION_LABELS: Record<string, string> = {
  "na-east": "North America (East)",
  "na-west": "North America (West)",
  "eu-west": "Europe (West)",
  "eu-central": "Europe (Central)",
  "ap-northeast": "Asia-Pacific (NE)",
  "ap-southeast": "Asia-Pacific (SE)",
  "sa-east": "South America (East)",
  oce: "Oceania",
};

export function CdnAdminPage() {
  const nodesQuery = useCdnNodes();
  const statsQuery = useDistributionStats();
  const patchesQuery = useDeltaPatches();
  const setStatus = useSetCdnNodeStatus();

  const nodes = nodesQuery.data ?? [];
  const stats = statsQuery.data ?? [];
  const patches = patchesQuery.data ?? [];

  const kpis = useMemo(() => {
    const onlineCount = nodes.filter((n) => n.status === "online").length;
    const totalBytes = stats.reduce((acc, s) => acc + s.totalBytes24h, 0);
    const avgHit = stats.length
      ? stats.reduce((acc, s) => acc + s.avgCacheHitPct, 0) / stats.length
      : 0;
    const totalThroughput = nodes.reduce((acc, n) => acc + n.throughputGbps, 0);
    return { onlineCount, totalBytes, avgHit, totalThroughput };
  }, [nodes, stats]);

  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const region of stats) {
      for (const point of region.series) {
        buckets.set(point.bucket, (buckets.get(point.bucket) ?? 0) + point.bytesServed);
      }
    }
    return Array.from(buckets.entries())
      .map(([bucket, bytes]) => ({ bucket, gb: bytes / 1_000_000_000 }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
  }, [stats]);

  const isLoading = nodesQuery.isLoading || statsQuery.isLoading || patchesQuery.isLoading;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-[20px] font-semibold text-foreground">CDN &amp; Distribution</h1>
        <p className="text-[13px] text-muted/80">
          Edge node health, regional throughput, and delta-patch efficiency across the distribution backbone.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminKpiCard
          icon={Radio}
          label="Online edge nodes"
          value={`${kpis.onlineCount} / ${nodes.length}`}
        />
        <AdminKpiCard
          icon={Activity}
          label="Total throughput"
          value={`${kpis.totalThroughput.toFixed(1)} GB/s`}
        />
        <AdminKpiCard
          icon={HardDrive}
          label="Bytes served (24h)"
          value={formatBytes(kpis.totalBytes)}
        />
        <AdminKpiCard
          icon={Zap}
          label="Avg cache hit"
          value={`${kpis.avgHit.toFixed(1)}%`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Throughput (24h, all regions)
        </h2>
        <Card className="p-4">
          {chartData.length === 0 ? (
            <EmptyState title="No distribution telemetry yet" />
          ) : (
            <ChartContainer height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dw-cdn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--steam-accent)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--steam-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: "2-digit" })}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => `${v.toFixed(0)} GB`}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg)",
                    border: "1px solid var(--separator)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  formatter={(value: number) => [`${value.toFixed(2)} GB`, "Served"]}
                />
                <Area
                  type="monotone"
                  dataKey="gb"
                  stroke="var(--steam-accent)"
                  strokeWidth={2}
                  fill="url(#dw-cdn)"
                />
              </AreaChart>
            </ChartContainer>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Edge nodes
        </h2>
        <Card className="overflow-hidden">
          {nodes.length === 0 ? (
            <EmptyState
              icon={Globe2}
              title="No edge nodes registered"
              description="Seed dw_cdn_nodes to see live node telemetry."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="border-b border-separator bg-card-active/40">
                  <tr className="text-left text-[11px] uppercase tracking-widest text-muted/55">
                    <th className="px-4 py-2.5 font-semibold">Hostname</th>
                    <th className="px-4 py-2.5 font-semibold">Region</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Throughput</th>
                    <th className="px-4 py-2.5 font-semibold">Load</th>
                    <th className="px-4 py-2.5 font-semibold">Cache hit</th>
                    <th className="px-4 py-2.5 font-semibold">Clients</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node) => (
                    <tr key={node.id} className="border-b border-separator/60 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-[12px] text-foreground/85">
                        {node.hostname}
                      </td>
                      <td className="px-4 py-2.5 text-muted/85">
                        {REGION_LABELS[node.region] ?? node.region}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            STATUS_STYLES[node.status],
                          )}
                        >
                          {STATUS_LABELS[node.status]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-foreground/80">
                        {node.throughputGbps.toFixed(2)} GB/s
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-input">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                node.loadPct > 85
                                  ? "bg-red"
                                  : node.loadPct > 65
                                    ? "bg-orange"
                                    : "bg-green",
                              )}
                              style={{ width: `${Math.min(node.loadPct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-muted/85">
                            {node.loadPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-foreground/80">
                        {node.cacheHitPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-muted/85">
                        {node.activeClients.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={setStatus.isPending}
                          onClick={() =>
                            setStatus.mutate({
                              nodeId: node.id,
                              status: node.status === "maintenance" ? "online" : "maintenance",
                            })
                          }
                        >
                          {node.status === "maintenance" ? "Resume" : "Maintenance"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Recent delta patches
        </h2>
        <Card className="overflow-hidden">
          {patches.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No delta patches yet"
              description="Patches will appear once builds are uploaded for games with prior versions."
            />
          ) : (
            <div className="divide-y divide-separator/60">
              {patches.slice(0, 12).map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-foreground/85">
                      {p.gameId} · {p.fromVersion} → {p.toVersion}
                    </span>
                    <span className="text-[11px] text-muted/65">
                      {new Date(p.releasedAt).toLocaleString()} · {p.changedChunkIds.length} chunks
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="text-muted/80">
                      {formatBytes(p.deltaBytes)} / {formatBytes(p.fullBytes)}
                    </span>
                    <span className="rounded-full bg-green/15 px-2 py-0.5 font-semibold text-green">
                      −{p.savingsPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
