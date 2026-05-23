import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { compactNumber } from "@/lib/utils";
import type { ConsoleMultiSeriesPoint } from "@/lib/types";

interface Series {
  key: string;
  label: string;
  /** CSS var name without var(). */
  colorVar: string;
}

interface Props {
  data: ConsoleMultiSeriesPoint[];
  series: Series[];
  height?: number;
  stacked?: boolean;
}

export function ConsoleMultiSeriesChart({
  data,
  series,
  height = 240,
  stacked = false,
}: Props) {
  const formatted = data.map((d) => ({
    ...d,
    t: new Date(d.bucket).getTime(),
  }));
  return (
    <ChartContainer height={height}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`dw-cms-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(${s.colorVar})`} stopOpacity={0.35} />
              <stop offset="100%" stopColor={`var(${s.colorVar})`} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
        <XAxis
          dataKey="t"
          tickFormatter={(t) =>
            new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          }
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
        />
        <YAxis
          tickFormatter={(v) => compactNumber(v)}
          tickLine={false}
          axisLine={false}
          width={42}
          tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg)",
            border: "1px solid var(--separator)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelFormatter={(t) => new Date(t).toLocaleString()}
          formatter={(value: number, key) => [
            compactNumber(value),
            series.find((s) => s.key === key)?.label ?? String(key),
          ]}
        />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            stackId={stacked ? "stack" : undefined}
            stroke={`var(${s.colorVar})`}
            strokeWidth={1.5}
            fill={`url(#dw-cms-${s.key})`}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
