import { Card } from "@/components/ui/card";
import { ConsoleTimeChart } from "@/components/console/ConsoleTimeChart";
import type { CrashFreeSnapshot } from "@/lib/types";

interface Props {
  data: CrashFreeSnapshot;
}

export function ConsoleCrashFreeCard({ data }: Props) {
  const pct = data.crashFreePct.toFixed(2);
  const color =
    data.crashFreePct >= 99.5
      ? "text-green"
      : data.crashFreePct >= 98
        ? "text-acid"
        : data.crashFreePct >= 95
          ? "text-orange"
          : "text-red";
  return (
    <Card className="p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted/55">Crash-free sessions</p>
      <p className={`mt-1 text-[28px] font-semibold tabular-nums ${color}`}>{pct}%</p>
      <p className="mt-0.5 text-[11.5px] text-muted/55">
        {data.sessionsWithError.toLocaleString()} of {data.totalSessions.toLocaleString()} sessions
        hit an error
      </p>
      <div className="mt-3">
        <ConsoleTimeChart
          data={data.series}
          colorVar="--red"
          gradientId="dw-console-crashfree"
          valueLabel="Errored sessions"
          height={120}
        />
      </div>
    </Card>
  );
}
