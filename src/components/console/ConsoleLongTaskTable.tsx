import type { LongTaskAttribution } from "@/lib/types";

interface Props {
  rows: LongTaskAttribution[];
}

export function ConsoleLongTaskTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No long tasks recorded.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">Script</th>
          <th className="text-left font-normal pb-1.5">Top route</th>
          <th className="text-right font-normal pb-1.5 pr-2">Count</th>
          <th className="text-right font-normal pb-1.5 pr-2">Avg</th>
          <th className="text-right font-normal pb-1.5">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.scriptUrl} className="border-t border-separator/50">
            <td className="py-1.5 text-foreground/85 truncate max-w-[260px] font-mono text-[11px]">
              {r.scriptUrl}
            </td>
            <td className="py-1.5 text-muted/70 truncate max-w-[200px]">{r.topRoute}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{r.count}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{r.avgMs} ms</td>
            <td className="py-1.5 text-right tabular-nums text-orange/80">{r.totalMs} ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
