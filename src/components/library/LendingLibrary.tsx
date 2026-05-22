import { useState } from "react";
import { BookOpen, Clock, Users } from "lucide-react";
import { motion } from "motion/react";
import { useGames } from "@/hooks/use-games";
import { Button } from "@/components/ui/button";

export function LendingLibrary() {
  const { data: games } = useGames();
  const singlePlayerGames = (games ?? []).filter(g => g.tags?.includes("Singleplayer") || true).slice(0, 4);

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-[24px] font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-acid" /> Lending Library
        </h2>
        <p className="text-[14px] text-muted/80 max-w-2xl">
          Securely loan your digital single-player games to friends. While loaned, you cannot play the game until it is returned.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {singlePlayerGames.map(game => (
            <div key={game.id} className="rounded-xl border border-separator bg-card overflow-hidden flex flex-col">
              <img src={game.headerUrl} alt={game.name} className="h-32 object-cover w-full" />
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-foreground line-clamp-1">{game.name}</h3>
                  <p className="text-[11px] text-muted mt-1">Eligible for 7-day loan</p>
                </div>
                <Button className="w-full mt-4 bg-input hover:bg-card-hover text-foreground border-separator h-8 text-[12px] cursor-pointer">
                  <Users className="h-3 w-3 mr-1.5" /> Loan to Friend
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="rounded-xl border border-acid/30 bg-acid/5 p-5">
          <h3 className="text-[14px] font-bold text-foreground mb-4">Active Loans</h3>
          
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-3 border border-separator/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
              <p className="text-[12px] font-bold text-foreground">Cyber Strike</p>
              <p className="text-[11px] text-muted mt-1">Loaned to <span className="text-foreground font-semibold">Alex_Tryhard</span></p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-500/10 w-fit px-2 py-1 rounded-md">
                <Clock className="h-3 w-3" /> 2 days remaining
              </div>
            </div>
            
            <button className="w-full text-[12px] font-bold text-muted hover:text-foreground py-2 border border-dashed border-separator rounded-lg hover:bg-input transition-colors cursor-pointer">
              View Past History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
