import { Cpu, Monitor, Zap, Server, ChevronRight, Edit2, Check, X } from "lucide-react";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useMemo, useState } from "react";
import { useProfileStore } from "@/stores/profile-store";

export function SystemInfoPanel() {
  const { data: games } = useGames();
  const library = useLibraryStore((s) => s.entries);
  const { systemRig, customFps, setCustomFps } = useProfileStore();
  const [isEditingFps, setIsEditingFps] = useState(false);

  const baseFpsRecommendations = useMemo(() => {
    if (!games) return [];
    
    // Find games that are installed
    const installedGameIds = library.filter(e => e.installed).map(e => e.gameId);
    const installedGames = games.filter(g => installedGameIds.includes(g.id));
    
    return installedGames.slice(0, 4).map(game => {
      const isIndie = game.tags?.includes("Indie");
      const isAAA = game.tags?.includes("RPG") || game.tags?.includes("Action");
      
      const fps = isIndie ? 240 + Math.floor(Math.random() * 60) : isAAA ? 80 + Math.floor(Math.random() * 40) : 144;
      const quality = isIndie ? "Max 1440p" : isAAA ? "High 1440p (RT On)" : "Ultra 1440p";
      
      return {
        gameId: game.id,
        gameName: game.name,
        fps,
        quality,
        gameIconUrl: game.capsuleUrl || game.coverUrl,
      };
    });
  }, [games, library]);

  // Merge with custom overrides
  const fpsRecommendations = useMemo(() => {
    return baseFpsRecommendations.map(base => {
      const custom = customFps[base.gameId];
      if (custom) {
        return {
          ...base,
          fps: custom.fps,
          quality: custom.quality
        };
      }
      return base;
    });
  }, [baseFpsRecommendations, customFps]);

  const [editForms, setEditForms] = useState<Record<string, { fps: number; quality: string }>>({});

  const handleStartEditing = () => {
    const initial: Record<string, { fps: number; quality: string }> = {};
    fpsRecommendations.forEach(rec => {
      initial[rec.gameId] = { fps: rec.fps, quality: rec.quality };
    });
    setEditForms(initial);
    setIsEditingFps(true);
  };

  const handleSaveEditing = () => {
    Object.keys(editForms).forEach(gameId => {
      const base = baseFpsRecommendations.find(r => r.gameId === gameId);
      if (base) {
        setCustomFps(gameId, {
          ...base,
          fps: editForms[gameId].fps,
          quality: editForms[gameId].quality
        });
      }
    });
    setIsEditingFps(false);
  };

  return (
    <div className="rounded-2xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-cyan" />
          <h2 className="text-[16px] font-bold text-foreground">My System Rig</h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <HardwareCard icon={<Monitor />} title="OS & Display" value1={systemRig.os} value2={systemRig.display} />
            <HardwareCard icon={<Cpu />} title="Processor" value1={systemRig.cpu} />
            <HardwareCard icon={<Zap />} title="Graphics" value1={systemRig.gpu} />
            <HardwareCard icon={<Server />} title="Memory & Storage" value1={systemRig.ram} value2={systemRig.storage} />
          </div>
          
          <button className="text-[12px] font-bold text-cyan hover:text-cyan/80 transition-colors flex items-center gap-1 cursor-pointer">
            Run detailed hardware diagnostic <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="rounded-xl bg-card-active border border-separator/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow fill-yellow" /> FPS Estimates
            </h3>
            {!isEditingFps ? (
              <button 
                onClick={handleStartEditing}
                className="flex items-center gap-1 text-[12px] font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <Edit2 className="h-3 w-3" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditingFps(false)}
                  className="flex items-center gap-1 text-[12px] font-bold text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
                <button 
                  onClick={handleSaveEditing}
                  className="flex items-center gap-1 text-[12px] font-bold text-cyan hover:text-cyan/80 transition-colors cursor-pointer"
                >
                  <Check className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {fpsRecommendations.map((rec) => (
              <div key={rec.gameId} className="flex items-center justify-between group">
                <div className="flex items-center gap-3 w-full pr-2">
                  <div className="shrink-0 w-8 h-8 rounded overflow-hidden border border-separator/30">
                    <img src={rec.gameIconUrl} alt={rec.gameName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground group-hover:text-cyan transition-colors cursor-pointer truncate">
                      {rec.gameName}
                    </p>
                    {isEditingFps ? (
                      <input 
                        className="text-[10px] text-muted/80 bg-input border border-separator/30 rounded px-1 w-full mt-1 outline-none focus:border-cyan/50"
                        value={editForms[rec.gameId]?.quality || ""}
                        onChange={(e) => setEditForms(prev => ({ ...prev, [rec.gameId]: { ...prev[rec.gameId], quality: e.target.value } }))}
                      />
                    ) : (
                      <p className="text-[10px] text-muted/60">{rec.quality}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end justify-center">
                  {isEditingFps ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        className="text-[14px] font-mono font-bold text-acid bg-input border border-separator/30 rounded px-1 w-12 text-right outline-none focus:border-cyan/50"
                        value={editForms[rec.gameId]?.fps || 0}
                        onChange={(e) => setEditForms(prev => ({ ...prev, [rec.gameId]: { ...prev[rec.gameId], fps: parseInt(e.target.value) || 0 } }))}
                      />
                    </div>
                  ) : (
                    <span className="text-[14px] font-mono font-bold text-acid">{rec.fps}</span>
                  )}
                  <span className="text-[10px] text-muted uppercase mt-0.5">FPS</span>
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
