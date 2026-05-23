import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart-container";
import { compactNumber } from "@/lib/utils";
import type { ConsoleNamedCount } from "@/lib/types";

const PALETTE = [
  "--acid",
  "--cyan",
  "--green",
  "--orange",
  "--brand-plus",
  "--brand-steam",
  "--brand-twitch",
];

interface Props {
  data: ConsoleNamedCount[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function ConsoleDonut({ data, height = 220, innerRadius = 56, outerRadius = 84 }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <ChartContainer height={height}>
          <PieChart>
            <Pie
              data={data.map((d) => ({ name: d.name, value: d.count }))}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              stroke="var(--bg)"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={`var(${PALETTE[i % PALETTE.length]})`} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--bg)",
                border: "1px solid var(--separator)",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number, name) => [
                `${compactNumber(value)} (${Math.round((value / total) * 100)}%)`,
                String(name),
              ]}
            />
          </PieChart>
        </ChartContainer>
      </div>
      <div className="flex w-44 shrink-0 flex-col gap-1.5">
        {data.slice(0, 8).map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: `var(${PALETTE[i % PALETTE.length]})` }}
            />
            <span className="flex-1 truncate text-muted/80">{d.name}</span>
            <span className="tabular-nums text-foreground/80">
              {Math.round((d.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
