import { useState } from "react";
import { Gift, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface ChipInGiftingProps {
  totalCents: number;
}

export function ChipInGifting({ totalCents }: ChipInGiftingProps) {
  const [splitCount, setSplitCount] = useState(1);
  const [enabled, setEnabled] = useState(false);

  if (!enabled) {
    return (
      <button 
        onClick={() => setEnabled(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-separator bg-card-active/30 p-4 text-left transition-colors hover:border-acid/50 hover:bg-acid/5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-acid/10 text-acid">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-[13px] font-semibold text-foreground">Chip-In Gifting</h4>
          <p className="text-[11px] text-muted/70">Split this purchase with friends.</p>
        </div>
      </button>
    );
  }

  const perPerson = Math.ceil(totalCents / splitCount);

  return (
    <div className="rounded-xl border border-acid/30 bg-acid/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-acid" />
          <h4 className="text-[13px] font-semibold text-foreground">Split Payment</h4>
        </div>
        <button onClick={() => setEnabled(false)} className="text-[11px] text-muted hover:text-foreground">
          Cancel
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 items-center rounded-lg border border-separator bg-card px-3">
          <button 
            onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
            className="text-muted hover:text-foreground"
          >-</button>
          <span className="w-12 text-center text-[13px] font-medium text-foreground">{splitCount} People</span>
          <button 
            onClick={() => setSplitCount(splitCount + 1)}
            className="text-muted hover:text-foreground"
          >+</button>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[11px] text-muted/70">Each pays</p>
          <p className="text-[16px] font-bold text-acid">{formatPrice(perPerson)}</p>
        </div>
      </div>

      {splitCount > 1 && (
        <div className="mb-4 space-y-2">
          {Array.from({ length: splitCount - 1 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg border border-separator bg-card p-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-card-active text-[10px] text-muted">
                {i + 1}
              </div>
              <input 
                type="text" 
                placeholder="Friend's username (@tag)" 
                className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted/40"
              />
              <Button size="sm" variant="secondary" className="h-6 px-2 text-[10px]">Invite</Button>
            </div>
          ))}
        </div>
      )}

      <Button className="w-full bg-acid text-background hover:brightness-110">
        <CreditCard className="mr-2 h-4 w-4" />
        Pay Your Share ({formatPrice(perPerson)})
      </Button>
    </div>
  );
}
