import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Coins } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart-container";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import type { RevenuePoint } from "@/lib/types";

interface RevenueCardProps {
  data: RevenuePoint[];
  totalCents: number;
}

export function RevenueCard({ data, totalCents }: RevenueCardProps) {
  const formatted = data.map((p) => ({
    date: new Date(p.date).getTime(),
    cents: p.cents,
  }));

  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const trailing90 = data
    .filter((p) => new Date(p.date).getTime() >= cutoff)
    .reduce((s, p) => s + p.cents, 0);

  return (
    <Card className="p-5">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Coins className="h-4 w-4 text-green" /> Revenue
          </h3>
          <p className="text-[12px] text-muted/60">
            Net of refunds. Order totals are split evenly across the games in each order.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold tabular-nums text-foreground">
            {formatPrice(totalCents)}
          </p>
          <p className="text-[11px] text-muted/55">{formatPrice(trailing90)} trailing 90d</p>
        </div>
      </header>
      {formatted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator p-6 text-center text-[12px] text-muted/55">
          No revenue yet. Once orders are placed, monthly revenue appears here.
        </p>
      ) : (
        <ChartContainer height={220}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="dw-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
            <XAxis
              dataKey="date"
              tickFormatter={(t) =>
                new Date(t).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
              }
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatPrice(v)}
              tickLine={false}
              axisLine={false}
              width={64}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg)",
                border: "1px solid var(--separator)",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelFormatter={(t) => new Date(t).toLocaleDateString()}
              formatter={(value: number) => [formatPrice(value), "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="cents"
              stroke="var(--green)"
              strokeWidth={2}
              fill="url(#dw-revenue)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
