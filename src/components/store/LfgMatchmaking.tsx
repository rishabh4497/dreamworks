import { useState } from "react";
import { Users, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLfgGroups } from "@/hooks/use-lfg-groups";
import { cn } from "@/lib/utils";

interface LfgMatchmakingProps {
  gameId: string;
}

export function LfgMatchmaking({ gameId }: LfgMatchmakingProps) {
  const { data: groups = [] } = useLfgGroups(gameId);
  const [searching, setSearching] = useState(false);

  return (
    <div className="rounded-2xl border border-separator bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-acid" />
          <h3 className="text-[14px] font-semibold text-foreground">Looking for Group</h3>
        </div>
        <span className="rounded-full bg-acid/10 px-2 py-0.5 text-[10px] font-bold text-acid uppercase tracking-widest">Matchmaking</span>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="flex items-center justify-between rounded-xl border border-separator/50 bg-card-active p-3 transition-colors hover:border-acid/30">
            <div className="flex items-center gap-3">
              <img loading="lazy" decoding="async" loading="lazy" decoding="async" src={group.avatar} alt={group.host} className="h-8 w-8 rounded-full border border-separator bg-black/20" />
              <div>
                <p className="text-[12px] font-medium text-foreground">{group.host}'s Lobby</p>
                <div className="flex items-center gap-2 text-[10px] text-muted/70">
                  <span className={cn(
                    group.playstyle === "Tryhard" ? "text-orange" : 
                    group.playstyle === "Casual" ? "text-green" : "text-blue"
                  )}>
                    {group.playstyle}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {group.max - group.spots}/{group.max}
                  </span>
                  {group.needMic && (
                    <>
                      <span>·</span>
                      <Mic className="h-3 w-3" />
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button size="sm" variant="secondary" className="h-7 text-[11px] px-3">
              Join
            </Button>
          </div>
        ))}
      </div>

      <Button 
        onClick={() => setSearching(!searching)}
        className="mt-4 w-full bg-card-active hover:bg-acid hover:text-background text-foreground transition-colors"
      >
        {searching ? "Cancel Search..." : "Create a Lobby"}
      </Button>
    </div>
  );
}
