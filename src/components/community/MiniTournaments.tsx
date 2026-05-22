import { Trophy, Users, ChevronRight } from "lucide-react";

export function MiniTournaments() {
  return (
    <div className="rounded-xl border border-separator bg-card overflow-hidden">
      <div className="bg-yellow/10 p-4 border-b border-yellow/20 flex items-center justify-between">
        <h3 className="text-[16px] font-bold text-yellow flex items-center gap-2">
          <Trophy className="h-5 w-5 fill-yellow" /> Daily Mini Tournaments
        </h3>
        <span className="text-[11px] font-bold text-yellow uppercase tracking-wider bg-yellow/20 px-2 py-1 rounded">Live Now</span>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="bg-input border border-separator rounded-lg p-3 hover:border-yellow/50 transition-colors cursor-pointer group flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-card rounded flex items-center justify-center border border-separator group-hover:border-yellow transition-colors">
              <Trophy className="h-5 w-5 text-muted group-hover:text-yellow" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground group-hover:text-yellow transition-colors">Rocket League 2v2 Draft</p>
              <p className="text-[11px] text-muted flex items-center gap-1"><Users className="h-3 w-3" /> 24/64 Players Joined</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-[10px] text-muted uppercase font-bold">Prize Pool</p>
              <p className="text-[12px] font-bold text-acid">5,000 DW Pts</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted group-hover:text-yellow transition-colors" />
          </div>
        </div>
        
        <div className="bg-input border border-separator rounded-lg p-3 hover:border-yellow/50 transition-colors cursor-pointer group flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-card rounded flex items-center justify-center border border-separator group-hover:border-yellow transition-colors">
              <Trophy className="h-5 w-5 text-muted group-hover:text-yellow" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground group-hover:text-yellow transition-colors">Cyber Strike FFA</p>
              <p className="text-[11px] text-muted flex items-center gap-1"><Users className="h-3 w-3" /> 8/16 Players Joined</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-[10px] text-muted uppercase font-bold">Prize Pool</p>
              <p className="text-[12px] font-bold text-acid">1,000 DW Pts</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted group-hover:text-yellow transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
