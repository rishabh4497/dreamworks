import type { MemoryLeakSuspicion } from "@/lib/types";

interface Props {
  rows: MemoryLeakSuspicion[];
}

export function ConsoleMemoryLeakTable({ rows }: Props) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No leak suspicions in this window.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">UID</th>
          <th className="text-left font-normal pb-1.5">Top route</th>
          <th className="text-right font-normal pb-1.5 pr-2">Growth</th>
          <th className="text-right font-normal pb-1.5 pr-2">Window</th>
          <th className="text-right font-normal pb-1.5">Samples</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={(r.uid ?? "anon") + r.topRoute} className="border-t border-separator/50">
            <td className="py-1.5 font-mono text-[11px] text-foreground/85">{(r.uid ?? "anon").slice(0, 12)}</td>
            <td className="py-1.5 text-muted/70 truncate max-w-[260px]">{r.topRoute}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-orange/85">+{r.growthMb} MB</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{r.windowMinutes}m</td>
            <td className="py-1.5 text-right tabular-nums text-muted/60">{r.observedSamples}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
