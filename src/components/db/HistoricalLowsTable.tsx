import type { HistoricalLows } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function HistoricalLowsTable({ lows }: { lows: HistoricalLows }) {
  const rows: { label: string; value: number; muted?: boolean }[] = [
    { label: "Current price", value: lows.currentPrice },
    { label: "All-time low", value: lows.allTimeLow },
    { label: "Last 12 months low", value: lows.lastYearLow },
    { label: "Last 30 days low", value: lows.lastMonthLow },
  ];
  return (
    <div className="rounded-xl border border-separator bg-card overflow-hidden">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`flex items-center justify-between px-4 py-2.5 ${
            i < rows.length - 1 ? "border-b border-separator" : ""
          }`}
        >
          <span className="text-[12px] text-muted/70">{r.label}</span>
          <span className="text-[13px] font-semibold text-foreground">
            {formatPrice(r.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
