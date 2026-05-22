import { Cpu, Monitor, Zap, Server, ChevronRight } from "lucide-react";

import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useMemo } from "react";

export function SystemInfoPanel() {
  const { data: games } = useGames();
  const library = useLibraryStore((s) => s.entries);

  const fpsRecommendations = useMemo(() => {
    if (!games) return [];
    
    const systemInfo = {
      os: "Windows 11 Pro 64-bit",
      cpu: "AMD Ryzen 7 7800X3D (8-Core, 16-Thread)",
      gpu: "NVIDIA GeForce RTX 4080 SUPER 16GB",
      ram: "32 GB DDR5 6000MHz",
      storage: "2TB NVMe SSD",
      display: "2560 x 1440 @ 240Hz",
    };
    
    // Find games that are installed
    const installedGameIds = library.filter(e => e.installed).map(e => e.gameId);
    const installedGames = games.filter(g => installedGameIds.includes(g.id));
    
    return installedGames.slice(0, 4).map(game => {
      // Basic logic: if "Indie" tag it runs fast, if "RPG" runs medium, else random fast
      const isIndie = game.tags?.includes("Indie");
      const isAAA = game.tags?.includes("RPG") || game.tags?.includes("Action");
      
      const fps = isIndie ? 240 + Math.floor(Math.random() * 60) : isAAA ? 80 + Math.floor(Math.random() * 40) : 144;
      const quality = isIndie ? "Max 1440p" : isAAA ? "High 1440p (RT On)" : "Ultra 1440p";
      
      return {
        game: game.name,
        fps,
        quality,
        icon: isIndie ? "⚡" : isAAA ? "✨" : "🚀",
      };
    });
  }, [games, library]);

  return (
    <div className="rounded-2xl border border-separator bg-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Monitor className="h-5 w-5 text-cyan" />
        <h2 className="text-[16px] font-bold text-foreground">My System Rig</h2>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <HardwareCard icon={<Monitor />} title="OS & Display" value1={"Windows 11 Pro 64-bit"} value2={"2560 x 1440 @ 240Hz"} />
            <HardwareCard icon={<Cpu />} title="Processor" value1={"AMD Ryzen 7 7800X3D (8-Core, 16-Thread)"} />
            <HardwareCard icon={<Zap />} title="Graphics" value1={"NVIDIA GeForce RTX 4080 SUPER 16GB"} />
            <HardwareCard icon={<Server />} title="Memory & Storage" value1={"32 GB DDR5 6000MHz"} value2={"2TB NVMe SSD"} />
          </div>
          
          <button className="text-[12px] font-bold text-cyan hover:text-cyan/80 transition-colors flex items-center gap-1 cursor-pointer">
            Run detailed hardware diagnostic <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="rounded-xl bg-card-active border border-separator/50 p-4">
          <h3 className="text-[13px] font-bold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow fill-yellow" /> FPS Estimates for You
          </h3>
          <div className="space-y-3">
            {fpsRecommendations.map((rec, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]">{rec.icon}</span>
                  <div>
                    <p className="text-[12px] font-bold text-foreground group-hover:text-cyan transition-colors cursor-pointer">{rec.game}</p>
                    <p className="text-[10px] text-muted/60">{rec.quality}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-mono font-bold text-acid">{rec.fps}</span>
                  <span className="text-[10px] text-muted ml-1 uppercase">FPS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HardwareCard({ icon, title, value1, value2 }: { icon: React.ReactNode, title: string, value1: string, value2?: string }) {
  return (
    <div className="bg-input rounded-lg p-3 border border-separator/30">
      <div className="flex items-center gap-2 text-muted/60 mb-2">
        <div className="h-4 w-4">{icon}</div>
        <p className="text-[10px] font-bold uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-[12px] font-semibold text-foreground">{value1}</p>
      {value2 && <p className="text-[12px] font-semibold text-foreground mt-0.5">{value2}</p>}
    </div>
  );
}
