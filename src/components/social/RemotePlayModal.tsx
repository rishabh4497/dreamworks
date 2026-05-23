import { Gamepad2, Wifi, Users, Globe2 } from "lucide-react";

export function RemotePlayModal() {
  return (
    <div className="rounded-xl border border-separator bg-card overflow-hidden">
      <div className="bg-cyan/10 p-6 border-b border-cyan/20">
        <h3 className="text-[18px] font-bold text-cyan flex items-center gap-2">
          <Globe2 className="h-5 w-5" /> Remote Play Together
        </h3>
        <p className="text-[13px] text-cyan/80 mt-1">Stream local-multiplayer games to your friends over the internet.</p>
      </div>
      
      <div className="p-6 grid gap-4">
        <div className="flex items-center justify-between p-3 rounded-lg border border-separator bg-input">
          <div className="flex items-center gap-3">
            <img loading="lazy" decoding="async" loading="lazy" decoding="async" src="https://api.dicebear.com/7.x/bottts/svg?seed=Alex" alt="Alex" className="h-10 w-10 rounded-full border border-separator/50 bg-background" />
            <div>
              <p className="text-[13px] font-bold text-foreground">Alex_Tryhard</p>
              <p className="text-[11px] text-green flex items-center gap-1"><Wifi className="h-3 w-3" /> 24ms Ping • Ready</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold px-2 py-1 bg-card rounded-md border border-separator">
            <Gamepad2 className="h-4 w-4 text-purple-400" /> Player 2
          </div>
        </div>
        
        <button className="w-full py-3 bg-cyan text-background font-bold text-[13px] rounded-lg hover:brightness-110 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Users className="h-4 w-4" /> Start Streaming Session
        </button>
      </div>
    </div>
  );
}
