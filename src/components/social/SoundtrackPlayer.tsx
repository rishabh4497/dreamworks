import { useState } from "react";
import { Music, Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react";

export function SoundtrackPlayer() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4 rounded-full border border-separator/50 bg-card/80 p-2 backdrop-blur-xl shadow-2xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-inner">
        <Music className="h-5 w-5" />
      </div>
      
      <div className="flex flex-col min-w-[120px]">
        <span className="text-[12px] font-bold text-foreground leading-tight">Resurrections</span>
        <span className="text-[10px] text-muted font-medium">Celeste OST</span>
      </div>
      
      <div className="flex items-center gap-3 px-2 text-foreground">
        <SkipBack className="h-4 w-4 cursor-pointer hover:text-purple-400 transition-colors" />
        <button onClick={() => setPlaying(!playing)} className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-transform">
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </button>
        <SkipForward className="h-4 w-4 cursor-pointer hover:text-purple-400 transition-colors" />
      </div>
      
      <div className="flex items-center gap-2 pr-4 border-l border-separator/50 pl-4 text-muted hover:text-foreground cursor-pointer transition-colors">
        <Volume2 className="h-4 w-4" />
      </div>
    </div>
  );
}
