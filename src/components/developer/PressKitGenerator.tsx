import { FileImage, LayoutTemplate, Link as LinkIcon } from "lucide-react";

export function PressKitGenerator() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <LayoutTemplate className="h-5 w-5 text-indigo-400" /> Virtual Press Kit Generator
      </h3>
      <p className="text-[13px] text-muted/80 mb-4">Automatically generate a hosted, password-protected web page for journalists.</p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-input border border-separator border-dashed rounded-lg h-24 flex flex-col items-center justify-center text-muted cursor-pointer hover:border-indigo-400/50 hover:text-indigo-400 transition-colors">
          <FileImage className="h-5 w-5 mb-1" />
          <span className="text-[11px] font-bold">Drop Assets (.zip)</span>
        </div>
        <div className="bg-input border border-separator rounded-lg p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-muted">Press Keys Included</span>
          <span className="text-[20px] font-black text-foreground">500</span>
          <span className="text-[10px] text-positive">Auto-revokable</span>
        </div>
      </div>
      
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <LinkIcon className="h-4 w-4" />
          <span className="text-[12px] font-mono">press.dreamworks.com/cyber-strike</span>
        </div>
        <button className="bg-indigo-500 text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-indigo-600 transition-colors">Copy URL</button>
      </div>
    </div>
  );
}
