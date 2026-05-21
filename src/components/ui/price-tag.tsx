import type { Price } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface PriceTagProps {
  price: Price;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceTag({ price, size = "md", className }: PriceTagProps) {
  const isDiscounted = price.discountPct > 0 && !price.isFree;
  const isFree = price.isFree;

  const baseTextClass =
    size === "sm" ? "text-[11px]" : size === "lg" ? "text-[15px]" : "text-[13px]";
  const finalTextClass =
    size === "sm" ? "text-[12px]" : size === "lg" ? "text-[18px]" : "text-[14px]";

  if (isFree) {
    return (
      <span className={cn("font-semibold text-green", finalTextClass, className)}>Free</span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isDiscounted && (
        <span className="inline-flex items-center rounded-md bg-discount-bg px-1.5 py-[2px] text-[10px] font-bold text-discount-fg">
          -{price.discountPct}%
        </span>
      )}
      <div className="flex items-baseline gap-1.5">
        {isDiscounted && (
          <span className={cn("text-muted/50 line-through", baseTextClass)}>
            {formatPrice(price.base, price.currency)}
          </span>
        )}
        <span className={cn("font-semibold text-foreground", finalTextClass)}>
          {formatPrice(price.final, price.currency)}
        </span>
      </div>
    </div>
  );
}
