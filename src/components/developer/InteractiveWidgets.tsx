import { Code2, PlaySquare } from "lucide-react";

export function InteractiveWidgets() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
        <PlaySquare className="h-5 w-5 text-pink-500" /> Interactive Store Mini-Games
      </h3>
      <p className="text-[13px] text-muted/80 mb-6">Embed lightweight HTML5 interactive widgets directly onto your store page so users can test a mechanic.</p>

      <div className="bg-input border border-separator rounded-xl overflow-hidden mb-4">
        <div className="bg-card-active p-2 flex items-center gap-2 border-b border-separator">
          <Code2 className="h-4 w-4 text-muted" />
          <span className="text-[11px] font-mono text-muted">index.html</span>
        </div>
        <div className="p-4 text-[11px] font-mono text-muted/80 h-24 overflow-hidden">
          <span className="text-pink-400">&lt;div</span> <span className="text-cyan">id</span>="game-container"<span className="text-pink-400">&gt;&lt;/div&gt;</span><br/>
          <span className="text-pink-400">&lt;script</span> <span className="text-cyan">src</span>="app.bundle.js"<span className="text-pink-400">&gt;&lt;/script&gt;</span><br/>
          <span className="text-pink-400">&lt;style&gt;</span><br/>
          &nbsp;&nbsp;body {'{'} margin: 0; {'}'}<br/>
          <span className="text-pink-400">&lt;/style&gt;</span>
        </div>
      </div>
      
      <button className="w-full bg-card border border-separator border-dashed py-2 rounded-lg text-[12px] font-bold text-foreground hover:bg-input transition-colors">
        Upload HTML5 Zip Bundle
      </button>
    </div>
  );
}
