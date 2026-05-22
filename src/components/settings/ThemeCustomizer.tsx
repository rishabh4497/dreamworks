import { Paintbrush, Code, Download } from "lucide-react";

export function ThemeCustomizer() {
  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <h3 className="text-[16px] font-bold flex items-center gap-2 mb-2"><Paintbrush className="h-5 w-5 text-pink-400" /> App Themes</h3>
      <p className="text-[13px] text-muted/80 mb-6">Completely overhaul the Dreamworks launcher using custom CSS or community themes.</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-separator bg-input p-4 hover:border-pink-400/50 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-bold text-foreground">Cyberpunk Neon</span>
              <span className="text-[10px] text-pink-400 bg-pink-400/10 px-2 py-1 rounded uppercase font-bold tracking-wider">Active</span>
            </div>
            <p className="text-[11px] text-muted">A high-contrast neon theme by <span className="text-foreground">@NeonDreams</span></p>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 py-3 bg-card-active border border-dashed border-separator rounded-lg text-[13px] font-bold text-muted hover:text-foreground hover:border-muted transition-colors">
            <Download className="h-4 w-4" /> Browse Community Themes
          </button>
        </div>
        
        <div className="rounded-lg border border-separator bg-background overflow-hidden flex flex-col">
          <div className="bg-card-active border-b border-separator p-2 flex items-center gap-2">
            <Code className="h-4 w-4 text-muted" />
            <span className="text-[11px] font-mono text-muted font-bold">custom.css</span>
          </div>
          <div className="p-4 flex-1 text-[12px] font-mono text-muted/80 overflow-y-auto">
            <span className="text-pink-400">.dreamworks-button</span> {'{'} <br/>
            &nbsp;&nbsp;<span className="text-cyan">background</span>: linear-gradient(45deg, #ff0055, #00eeff);<br/>
            &nbsp;&nbsp;<span className="text-cyan">border-radius</span>: 0px;<br/>
            {'}'}<br/><br/>
            <span className="text-pink-400">.game-card</span> {'{'} <br/>
            &nbsp;&nbsp;<span className="text-cyan">box-shadow</span>: 0 0 20px rgba(0, 238, 255, 0.2);<br/>
            {'}'}
          </div>
        </div>
      </div>
    </div>
  );
}
