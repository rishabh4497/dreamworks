import { Trophy, Target, Star, ChevronRight } from "lucide-react";

export function QuestsPanel() {
  return (
    <div className="rounded-2xl border border-separator bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-acid" /> Weekly Quests
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">Earn Dreamworks Points to unlock profile themes.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-muted/60">Balance</p>
          <p className="text-[18px] font-bold text-acid">1,240 DP</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { name: "Try a Demo", desc: "Play any Next Fest demo for 30 mins", pts: 200, progress: 30, total: 30 },
          { name: "Social Butterfly", desc: "Join 3 LFG lobbies", pts: 150, progress: 1, total: 3 },
          { name: "Achievement Hunter", desc: "Unlock 5 rare achievements", pts: 500, progress: 2, total: 5 },
        ].map((q, i) => {
          const pct = Math.round((q.progress / q.total) * 100);
          const done = q.progress === q.total;
          
          return (
            <div key={i} className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${done ? "bg-acid/10 border-acid/30" : "bg-card-active border-separator"}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? "bg-acid/20 text-acid" : "bg-input text-muted"}`}>
                {done ? <Star className="h-5 w-5" fill="currentColor" /> : <Trophy className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[13px] font-semibold text-foreground">{q.name}</p>
                  <p className="text-[12px] font-bold text-acid">+{q.pts} DP</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-input overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${done ? "bg-acid" : "bg-blue"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted/70">{q.progress}/{q.total}</span>
                </div>
              </div>
              {done && (
                <button className="text-[11px] font-bold text-acid flex items-center hover:underline">
                  Claim <ChevronRight className="h-3 w-3 ml-0.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
