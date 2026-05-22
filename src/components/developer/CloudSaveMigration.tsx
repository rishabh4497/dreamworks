import { Cloud, ArrowRight } from "lucide-react";
export function CloudSaveMigration() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Cloud className="h-5 w-5 text-blue-400" /> Cloud Save Migration</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Automatically port Steam/Epic cloud save architectures into the Dreamworks Cloud ecosystem.</p>
      <div className="flex items-center justify-between bg-input p-3 rounded-lg">
        <div className="text-[12px] font-bold text-muted">Steam Auto-Cloud</div>
        <ArrowRight className="h-4 w-4 text-cyan" />
        <div className="text-[12px] font-bold text-foreground bg-cyan/20 px-2 py-1 rounded text-cyan">Dreamworks Cloud</div>
      </div>
    </div>
  );
}
