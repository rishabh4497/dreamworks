import type { ChurnPredictionRow } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

interface Props {
  rows: ChurnPredictionRow[];
}

function color(p: number): string {
  if (p >= 0.7) return "bg-red/20 text-red";
  if (p >= 0.45) return "bg-orange/15 text-orange";
  return "bg-acid/15 text-acid";
}

export function ConsoleChurnTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No churn predictions yet.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">UID</th>
          <th className="text-right font-normal pb-1.5 pr-2">Risk</th>
          <th className="text-left font-normal pb-1.5">Top factor</th>
          <th className="text-right font-normal pb-1.5 pr-2">Lifetime spend</th>
          <th className="text-right font-normal pb-1.5">Last seen</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.uid} className="border-t border-separator/50">
            <td className="py-1.5 font-mono text-[11px] text-foreground/85">{r.displayName}</td>
            <td className="py-1.5 pr-2 text-right">
              <span className={`rounded-md px-1.5 py-[2px] font-semibold tabular-nums ${color(r.churnProbability)}`}>
                {(r.churnProbability * 100).toFixed(0)}%
              </span>
            </td>
            <td className="py-1.5 text-muted/70">{r.topFactor}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/85">
              {formatPrice(r.lifetimeSpendCents, "USD")}
            </td>
            <td className="py-1.5 text-right text-muted/60">{r.lastSeenAt.slice(0, 10)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
