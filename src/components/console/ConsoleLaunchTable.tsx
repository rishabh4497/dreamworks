import type { GameLaunchReport } from "@/lib/types";

interface Props {
  report: GameLaunchReport;
}

export function ConsoleLaunchTable({ report }: Props) {
  if (report.byGame.length === 0) {
    return <p className="py-6 text-center text-[12px] text-muted/55">No launch telemetry yet.</p>;
  }
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-widest text-muted/45">
          <th className="text-left font-normal pb-1.5">Game</th>
          <th className="text-right font-normal pb-1.5 pr-2">Attempts</th>
          <th className="text-right font-normal pb-1.5 pr-2">Success</th>
          <th className="text-right font-normal pb-1.5 pr-2">Crash &lt;5m</th>
          <th className="text-right font-normal pb-1.5">TTP (s)</th>
        </tr>
      </thead>
      <tbody>
        {report.byGame.map((g) => (
          <tr key={g.gameId} className="border-t border-separator/50">
            <td className="py-1.5 text-foreground/85 truncate max-w-[260px]">{g.title}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-muted/70">{g.attempts}</td>
            <td className="py-1.5 pr-2 text-right tabular-nums text-foreground/80">
              {g.successPct.toFixed(1)}%
            </td>
            <td
              className={`py-1.5 pr-2 text-right tabular-nums ${
                g.crash5MinPct > 5 ? "text-red/85" : "text-muted/70"
              }`}
            >
              {g.crash5MinPct.toFixed(1)}%
            </td>
            <td className="py-1.5 text-right tabular-nums text-muted/60">
              {g.medianTimeToPlayableSec}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
