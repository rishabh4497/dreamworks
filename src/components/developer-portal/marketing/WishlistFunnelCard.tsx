import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAppAnalytics } from "@/hooks/use-analytics";
import { compactNumber } from "@/lib/utils";
import { wishlistToPurchaseConversion } from "@/lib/api/analytics";

export function WishlistFunnelCard({ appId }: { appId: string }) {
  const a = useAppAnalytics(appId);
  const conv = wishlistToPurchaseConversion(a.wishlistCount, a.orderCount);
  const wishlistWidth = a.wishlistCount > 0 ? 100 : 0;
  const purchaseWidth =
    a.wishlistCount > 0 ? Math.min(100, Math.round((a.orderCount / a.wishlistCount) * 100)) : 0;

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <TrendingUp className="h-4 w-4 text-green" /> Wishlist → purchase
          </h3>
          <p className="text-[12px] text-muted/60">
            Conversion of total wishlists to orders. A useful pulse leading into a sale or release.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-semibold tabular-nums text-foreground">{conv.pct}%</p>
          <p className="text-[11px] text-muted/55">{conv.ratio}</p>
        </div>
      </header>

      <div className="space-y-3">
        <FunnelBar
          label="Wishlists"
          value={compactNumber(a.wishlistCount)}
          widthPct={wishlistWidth}
          colorClass="bg-acid"
        />
        <FunnelBar
          label="Purchases"
          value={compactNumber(a.orderCount)}
          widthPct={purchaseWidth}
          colorClass="bg-green"
        />
      </div>
    </Card>
  );
}

function FunnelBar({
  label,
  value,
  widthPct,
  colorClass,
}: {
  label: string;
  value: string;
  widthPct: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium">
        <span className="text-foreground/85">{label}</span>
        <span className="tabular-nums text-muted/65">{value}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-input">
        <div className={`h-full ${colorClass}`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}
