import { Globe, Wand2, CheckCircle2 } from "lucide-react";
export function AILocalization() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2"><Globe className="h-5 w-5 text-cyan" /> AI Localization Pipeline</h3>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">Instantly draft translations for your store page and basic UI strings into 15 languages.</p>
      <div className="flex items-center gap-4">
        <button className="bg-cyan/20 text-cyan px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 hover:bg-cyan/30 cursor-pointer"><Wand2 className="h-4 w-4" /> Generate Translations</button>
        <span className="text-[12px] text-muted flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-positive" /> English Base Language Detected</span>
      </div>
    </div>
  );
}
