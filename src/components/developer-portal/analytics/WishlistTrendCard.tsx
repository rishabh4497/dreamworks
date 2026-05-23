import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Heart } from "lucide-react";
import { ChartContainer } from "@/components/ui/chart-container";
import { Card } from "@/components/ui/card";
import { compactNumber } from "@/lib/utils";
import type { WishlistTrendPoint } from "@/lib/types";

export function WishlistTrendCard({ data }: { data: WishlistTrendPoint[] }) {
  const formatted = data.map((p) => ({
    date: new Date(p.date).getTime(),
    count: p.count,
  }));

  return (
    <Card className="p-5">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Heart className="h-4 w-4 text-acid" /> Wishlist trend
          </h3>
          <p className="text-[12px] text-muted/60">Cumulative wishlist adds, weekly buckets.</p>
        </div>
        <span className="text-[18px] font-semibold tabular-nums text-foreground">
          {compactNumber(data[data.length - 1]?.count ?? 0)}
        </span>
      </header>
      {formatted.length === 0 ? (
        <p className="rounded-xl border border-dashed border-separator p-6 text-center text-[12px] text-muted/55">
          No wishlist activity yet. Adds will appear here weekly once players start wishlisting.
        </p>
      ) : (
        <ChartContainer height={220}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="dw-wishlist" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--acid)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--acid)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
            <XAxis
              dataKey="date"
              tickFormatter={(t) =>
                new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              }
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
              formatter={(value: number) => [compactNumber(value), "Wishlists"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--acid)"
              strokeWidth={2}
              fill="url(#dw-wishlist)"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Card>
  );
}
