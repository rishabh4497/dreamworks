import { Scissors, Sparkles, PlayCircle, Share2 } from "lucide-react";

export function HighlightEditor() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-4">
        <Scissors className="h-5 w-5 text-acid" /> AI Highlight Reel Editor
      </h3>
      <div className="grid grid-cols-[1fr_200px] gap-6">
        <div className="relative aspect-video rounded-lg overflow-hidden border border-separator/50 bg-black flex items-center justify-center group cursor-pointer">
          <img loading="lazy" decoding="async" loading="lazy" decoding="async" src="https://images.igdb.com/igdb/image/upload/t_screenshot_big/sc8f29.jpg" alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
          <PlayCircle className="absolute h-12 w-12 text-white/80 group-hover:scale-110 transition-transform" />
          
          <div className="absolute bottom-4 left-4 right-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-acid w-1/3 rounded-full relative">
              <div className="absolute -right-1.5 -top-1.5 h-4 w-4 bg-white rounded-full shadow" />
            </div>
          </div>
        </div>
        
        <div className="space-y-3 flex flex-col">
          <p className="text-[12px] text-muted leading-relaxed">
            AI detected <strong className="text-foreground">3 multi-kills</strong> and <strong className="text-foreground">1 boss defeat</strong> in your recent 2-hour Cyber Strike session.
          </p>
          <button className="flex items-center justify-center gap-2 w-full py-2 bg-acid/10 text-acid border border-acid/30 rounded-lg text-[12px] font-bold hover:bg-acid/20 transition-colors">
            <Sparkles className="h-3.5 w-3.5" /> Auto-Trim to 30s
          </button>
          <button className="flex items-center justify-center gap-2 w-full py-2 bg-input text-foreground border border-separator rounded-lg text-[12px] font-bold hover:bg-card-hover mt-auto transition-colors">
            <Share2 className="h-3.5 w-3.5" /> Export to TikTok
          </button>
        </div>
      </div>
    </div>
  );
}
