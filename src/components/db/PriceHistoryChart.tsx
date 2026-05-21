import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import type { PriceHistoryPoint } from "@/lib/types";
import { ChartContainer } from "@/components/ui/chart-container";
import { formatPrice } from "@/lib/utils";

export function PriceHistoryChart({ data }: { data: PriceHistoryPoint[] }) {
  const formatted = data.map((p) => ({
    date: new Date(p.date).getTime(),
    price: p.cents / 100,
    discount: p.discountPct,
  }));

  return (
    <ChartContainer height={240}>
      <AreaChart data={formatted}>
        <defs>
          <linearGradient id="dw-price" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--steam-accent)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--steam-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
        <XAxis
          dataKey="date"
          tickFormatter={(t) => new Date(t).toLocaleDateString("en-US", { month: "short" })}
          interval="preserveStartEnd"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => `$${v.toFixed(0)}`}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg)",
            border: "1px solid var(--separator)",
            borderRadius: 12,
            fontSize: 12,
          }}
          labelFormatter={(t) => new Date(t).toLocaleDateString()}
          formatter={(value: number) => [formatPrice(value * 100), "Price"]}
        />
        <Area
          type="stepAfter"
          dataKey="price"
          stroke="var(--steam-accent)"
          strokeWidth={2}
          fill="url(#dw-price)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
