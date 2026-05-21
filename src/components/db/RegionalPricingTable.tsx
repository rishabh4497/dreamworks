import type { RegionalPrice } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function RegionalPricingTable({ prices }: { prices: RegionalPrice[] }) {
  const sorted = [...prices].sort((a, b) => a.usdEquivalentCents - b.usdEquivalentCents);
  const minUsd = sorted[0]?.usdEquivalentCents ?? 0;

  return (
    <div className="overflow-hidden rounded-xl border border-separator bg-card">
      <table className="w-full text-[12px]">
        <thead className="border-b border-separator text-left text-muted/60">
          <tr>
            <th className="px-4 py-2 font-medium">Region</th>
            <th className="px-4 py-2 font-medium">Price</th>
            <th className="px-4 py-2 font-medium text-right">USD-equiv.</th>
            <th className="px-4 py-2 font-medium text-right">vs cheapest</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const delta = r.usdEquivalentCents - minUsd;
            const pct = minUsd === 0 ? 0 : Math.round((delta / minUsd) * 100);
            return (
              <tr key={r.region} className="border-b border-separator last:border-0">
                <td className="px-4 py-2 text-foreground/80">{r.region}</td>
                <td className="px-4 py-2 text-muted/80">
                  {formatPrice(r.price, r.currency)}
                </td>
                <td className="px-4 py-2 text-right text-foreground/80">
                  {formatPrice(r.usdEquivalentCents)}
                </td>
                <td className="px-4 py-2 text-right text-muted/60">
                  {pct === 0 ? "—" : `+${pct}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
