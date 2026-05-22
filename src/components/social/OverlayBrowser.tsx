import { Globe, ArrowLeft, ArrowRight, RotateCcw, Home, Plus } from "lucide-react";

export function OverlayBrowser() {
  return (
    <div className="rounded-xl border border-separator bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto my-8">
      <div className="flex items-center gap-4 p-3 border-b border-separator/50 bg-card-active/50">
        <div className="flex items-center gap-2 text-muted">
          <ArrowLeft className="h-4 w-4 hover:text-foreground cursor-pointer transition-colors" />
          <ArrowRight className="h-4 w-4 opacity-50 cursor-not-allowed" />
          <RotateCcw className="h-4 w-4 hover:text-foreground cursor-pointer transition-colors" />
          <Home className="h-4 w-4 hover:text-foreground cursor-pointer transition-colors ml-2" />
        </div>
        
        <div className="flex-1 flex items-center bg-input border border-separator/50 rounded-lg px-3 py-1.5">
          <Globe className="h-3.5 w-3.5 text-muted mr-2" />
          <span className="text-[12px] text-foreground/80 font-medium">https://dreamworks.wiki/cyber-strike/weapons</span>
        </div>
        
        <div className="flex items-center gap-1">
          <div className="h-6 px-3 flex items-center bg-card border border-separator rounded-md text-[11px] font-bold text-foreground shadow-sm">
            Wiki <button className="ml-2 text-muted hover:text-foreground"><Plus className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
      
      <div className="h-[400px] bg-white relative overflow-hidden flex items-center justify-center">
        {/* Mock browser content */}
        <div className="absolute inset-0 p-8">
          <div className="w-48 h-8 bg-gray-200 rounded mb-6" />
          <div className="flex gap-6">
            <div className="w-64 h-64 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="w-full h-4 bg-gray-100 rounded" />
              <div className="w-full h-4 bg-gray-100 rounded" />
              <div className="w-3/4 h-4 bg-gray-100 rounded" />
              <div className="w-full h-4 bg-gray-100 rounded mt-8" />
              <div className="w-5/6 h-4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />
      </div>
    </div>
  );
}
