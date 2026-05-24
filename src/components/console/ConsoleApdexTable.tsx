import { cn } from "@/lib/utils";
import type { ApdexByRoute } from "@/lib/types";

interface Props {
  rows: ApdexByRoute[];
}

function color(score: number): string {
  if (score >= 0.94) return "bg-green/20 text-green";
  if (score >= 0.85) return "bg-acid/15 text-acid";
  if (score >= 0.7) return "bg-orange/15 text-orange";
  return "bg-red/15 text-red";
}

export function ConsoleApdexTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No samples yet.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">Route</th>
          <th className="text-right font-normal pb-1.5 pr-2">Apdex</th>
          <th className="text-right font-normal pb-1.5 pr-2">Sat</th>
          <th className="text-right font-normal pb-1.5 pr-2">Tol</th>
          <th className="text-right font-normal pb-1.5 pr-2">Fru</th>
          <th className="text-right font-normal pb-1.5">Samples</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.route} className="border-t border-separator/50">
            <td className="py-1.5 text-foreground/85 truncate max-w-[280px]">{r.route}</td>
            <td className="py-1.5 pr-2 text-right">
              <span
                className={cn(
                  "rounded-md px-1.5 py-[2px] font-semibold tabular-nums",
                  color(r.apdex),
                )}
              >
                {r.apdex.toFixed(2)}
              </span>
            </td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{r.satisfied}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-orange/80">{r.tolerating}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-red/80">{r.frustrating}</td>
            <td className="py-1.5 text-right tabular-nums text-muted/60">{r.samples}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
