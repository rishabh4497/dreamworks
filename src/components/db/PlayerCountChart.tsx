import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { PlayerCountPoint } from "@/lib/types";
import { ChartContainer } from "@/components/ui/chart-container";
import { compactNumber } from "@/lib/utils";

export function PlayerCountChart({ data }: { data: PlayerCountPoint[] }) {
  const formatted = data.map((p) => ({
    date: new Date(p.date).getTime(),
    peak: p.peak,
    avg: p.avg,
  }));

  return (
    <ChartContainer height={240}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="dw-players" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
        <XAxis
          dataKey="date"
          tickFormatter={(t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => compactNumber(v)}
          tickLine={false}
          axisLine={false}
          width={42}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg)",
            border: "1px solid var(--separator)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelFormatter={(t) => new Date(t).toLocaleDateString()}
          formatter={(value: number, key) => [compactNumber(value), key === "peak" ? "Peak" : "Average"]}
        />
        <Area type="monotone" dataKey="peak" stroke="var(--green)" strokeWidth={2} fill="url(#dw-players)" />
        <Area
          type="monotone"
          dataKey="avg"
          stroke="var(--steam-accent)"
          strokeWidth={1.5}
          fill="none"
        />
      </AreaChart>
    </ChartContainer>
  );
}
