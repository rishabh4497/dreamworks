import { Timer, PlayCircle, Medal } from "lucide-react";
import { useSpeedrunRuns } from "@/hooks/use-speedrun";

export function SpeedrunLeaderboards() {
  const { data: runs = [] } = useSpeedrunRuns();

  return (
    <div className="rounded-2xl border border-separator bg-card overflow-hidden mt-8">
      <div className="bg-card-active/50 p-4 border-b border-separator flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-foreground flex items-center gap-2">
          <Timer className="h-5 w-5 text-acid" /> Global Speedrun Leaderboards
        </h3>
        <select className="bg-input border border-separator rounded-lg px-3 py-1.5 text-[12px] font-bold text-foreground focus:outline-none">
          <option>Any% Unrestricted</option>
          <option>All Bosses</option>
          <option>Glitchless</option>
        </select>
      </div>
      
      <div>
        {runs.map((run, i) => (
          <div key={i} className="flex items-center justify-between p-4 border-b border-separator/50 last:border-0 hover:bg-card-hover transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-8 text-center text-[18px] font-black text-muted/50">{run.rank}</div>
              <img src={run.avatar} alt="Avatar" className="h-8 w-8 rounded-full border border-separator" />
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold text-foreground">{run.player}</span>
                {run.verified && (
                  <span title="Verified by Dreamworks Anti-Cheat">
                    <Medal className="h-3.5 w-3.5 text-yellow" />
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-[16px] font-mono font-bold text-acid">{run.time}</span>
              <button className="flex items-center gap-1.5 text-[11px] font-bold text-muted hover:text-foreground cursor-pointer">
                <PlayCircle className="h-4 w-4" /> Watch VOD
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
