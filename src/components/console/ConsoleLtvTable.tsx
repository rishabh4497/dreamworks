import type { LtvForecastRow } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  rows: LtvForecastRow[];
}

export function ConsoleLtvTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No LTV forecasts yet.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">UID</th>
          <th className="text-left font-normal pb-1.5">Segment</th>
          <th className="text-right font-normal pb-1.5 pr-2">7d actual</th>
          <th className="text-right font-normal pb-1.5 pr-2">90d predicted</th>
          <th className="text-right font-normal pb-1.5">Confidence</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.uid} className="border-t border-separator/50">
            <td className="py-1.5 font-mono text-[11px] text-foreground/85">{r.displayName}</td>
            <td className="py-1.5 text-muted/70">{r.segment}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">
              {formatPrice(r.actual7dCents, "USD")}
            </td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-green/85">
              {formatPrice(r.predicted90dCents, "USD")}
            </td>
            <td className="py-1.5 text-right tabular-nums text-muted/60">
              {Math.round(r.confidence * 100)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
