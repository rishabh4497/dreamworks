import { Coins, RefreshCw } from "lucide-react";

export function PriceHarmonization() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <Coins className="h-5 w-5 text-acid" /> Price Harmonization
          </h3>
          <p className="text-[13px] text-muted/80">Auto-adjust prices across 40 currencies to prevent VPN abuse.</p>
        </div>
        <button className="bg-acid text-background px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:brightness-110">
          <RefreshCw className="h-3 w-3" /> Sync Now
        </button>
      </div>

      <div className="bg-card-active rounded-lg border border-separator/50 overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-input border-b border-separator/50">
            <tr>
              <th className="p-2 font-bold text-muted uppercase">Region</th>
              <th className="p-2 font-bold text-muted uppercase">Old Price</th>
              <th className="p-2 font-bold text-muted uppercase">New Price</th>
              <th className="p-2 font-bold text-muted uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-separator/50">
              <td className="p-2 font-bold text-foreground">Argentina (ARS)</td>
              <td className="p-2 text-muted">$1,400</td>
              <td className="p-2 text-foreground font-bold">$4,200</td>
              <td className="p-2 text-acid">Adjusted</td>
            </tr>
            <tr className="border-b border-separator/50">
              <td className="p-2 font-bold text-foreground">Turkey (TRY)</td>
              <td className="p-2 text-muted">₺190</td>
              <td className="p-2 text-foreground font-bold">₺340</td>
              <td className="p-2 text-acid">Adjusted</td>
            </tr>
            <tr>
              <td className="p-2 font-bold text-foreground">Euro (EUR)</td>
              <td className="p-2 text-muted">€59.99</td>
              <td className="p-2 text-foreground font-bold">€59.99</td>
              <td className="p-2 text-muted">Stable</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
