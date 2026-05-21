import type { Depot } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

export function DepotsTable({ depots }: { depots: Depot[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-separator bg-card">
      <table className="w-full text-[12px]">
        <thead className="border-b border-separator text-left text-muted/60">
          <tr>
            <th className="px-4 py-2 font-medium">Depot</th>
            <th className="px-4 py-2 font-medium">Platform</th>
            <th className="px-4 py-2 font-medium text-right">Size</th>
            <th className="px-4 py-2 font-medium text-right">Last updated</th>
            <th className="px-4 py-2 font-medium text-right">Build</th>
          </tr>
        </thead>
        <tbody>
          {depots.map((d) => (
            <tr key={d.id} className="border-b border-separator last:border-0">
              <td className="px-4 py-2 text-foreground/80">{d.name}</td>
              <td className="px-4 py-2 capitalize text-muted/80">{d.platform}</td>
              <td className="px-4 py-2 text-right text-muted/80">{formatBytes(d.sizeBytes)}</td>
              <td className="px-4 py-2 text-right text-muted/60">{formatDate(d.lastUpdated)}</td>
              <td className="px-4 py-2 text-right font-mono text-muted/60">#{d.buildId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
