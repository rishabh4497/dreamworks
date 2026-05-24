import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { WishlistDecayReport } from "@/lib/types";

interface Props {
  report: WishlistDecayReport;
}

export function ConsoleWishlistDecayCurve({ report }: Props) {
  const data = report.decay.map((p) => ({
    days: p.daysSinceAdd,
    converted: Number(p.convertedPct.toFixed(2)),
    still: Number(p.stillOnWishlistPct.toFixed(2)),
  }));
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted/55">Wishlist → purchase decay</p>
          <p className="mt-0.5 text-[12px] text-muted/65">
            cohort {report.cohortSize.toLocaleString()} · median{" "}
            <span className="text-foreground/80 font-semibold">
              {report.medianTimeToConvertDays ?? "—"}
            </span>{" "}
            days
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="dw-wld-conv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--green)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--green)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="var(--separator)" />
          <XAxis
            dataKey="days"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: "days since add", fill: "var(--text-secondary)", fontSize: 11, offset: -4, position: "insideBottom" }}
          />
          <YAxis
            unit="%"
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
          />
          <Area
            type="monotone"
            dataKey="converted"
            stroke="var(--green)"
            fill="url(#dw-wld-conv)"
            strokeWidth={2}
            name="Converted %"
          />
          <Line type="monotone" dataKey="still" stroke="var(--acid)" strokeWidth={2} name="Still on wishlist %" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
