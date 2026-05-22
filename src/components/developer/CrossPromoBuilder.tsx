import { Link2, Plus } from "lucide-react";
export function CrossPromoBuilder() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Link2 className="h-5 w-5 text-acid" /> Cross-Promo Widget Builder</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Partner with other indie developers to create high-converting "Buy both for 20% off" banners.</p>
      <button className="w-full border border-dashed border-separator hover:bg-input py-6 rounded-xl flex flex-col items-center justify-center text-muted hover:text-foreground transition-colors cursor-pointer">
        <Plus className="h-6 w-6 mb-2" />
        <span className="text-[13px] font-bold">Create New Partnership Campaign</span>
      </button>
    </div>
  );
}
