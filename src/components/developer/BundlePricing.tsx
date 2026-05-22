import { PackageOpen, Calculator } from "lucide-react";
export function BundlePricing() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><PackageOpen className="h-5 w-5 text-green" /> Dynamic Bundle Adjuster</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Automatically adjust bundle prices based on what the user already owns.</p>
      <div className="bg-card-active rounded-xl p-4 border border-separator flex items-start gap-4">
        <Calculator className="h-6 w-6 text-green mt-1" />
        <div>
          <p className="text-[13px] font-bold text-foreground">Active Configuration:</p>
          <ul className="text-[12px] text-muted/80 mt-2 list-disc list-inside space-y-1">
            <li>"Complete Edition" Bundle (Base + 3 DLCs)</li>
            <li>Base Price: $59.99</li>
            <li>Deduct 100% of owned item MSRP</li>
            <li>Apply 15% Completion Discount</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
