import type { ResourceTimingRow } from "@/lib/types";

interface Props {
  rows: ResourceTimingRow[];
}

export function ConsoleResourceTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No resource samples yet.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">URL</th>
          <th className="text-right font-normal pb-1.5 pr-2">Init</th>
          <th className="text-right font-normal pb-1.5 pr-2">Count</th>
          <th className="text-right font-normal pb-1.5 pr-2">p50</th>
          <th className="text-right font-normal pb-1.5 pr-2">p95</th>
          <th className="text-right font-normal pb-1.5">Avg KB</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.url} className="border-t border-separator/50">
            <td className="py-1.5 text-foreground/85 truncate max-w-[320px]">{r.url}</td>
            <td className="py-1.5 pr-2 text-right text-muted/70">{r.initiatorType}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{r.count}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{Math.round(r.p50Ms)} ms</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/80">{Math.round(r.p95Ms)} ms</td>
            <td className="py-1.5 text-right tabular-nums text-muted/60">{r.sizeKb}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
