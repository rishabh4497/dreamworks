import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { compactNumber } from "@/lib/utils";
import type { ConsoleTimePoint } from "@/lib/types";

interface Props {
  data: ConsoleTimePoint[];
  /** CSS variable name without the leading var(). Defaults to "--acid". */
  colorVar?: string;
  /** Stable gradient id — must be unique per chart instance. */
  gradientId?: string;
  height?: number;
  /** Label shown in the tooltip for the y-value. */
  valueLabel?: string;
}

export function ConsoleTimeChart({
  data,
  colorVar = "--acid",
  gradientId = "dw-console-area",
  height = 220,
  valueLabel = "Count",
}: Props) {
  const formatted = data.map((p) => ({
    t: new Date(p.bucket).getTime(),
    v: p.value,
  }));
  return (
    <ChartContainer height={height}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={`var(${colorVar})`} stopOpacity={0.4} />
            <stop offset="100%" stopColor={`var(${colorVar})`} stopOpacity={0} />
          </linearGradient>
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
          formatter={(value: number) => [compactNumber(value), valueLabel]}
        />
        <Area
          type="monotone"
          dataKey="v"
          stroke={`var(${colorVar})`}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ChartContainer>
  );
}
