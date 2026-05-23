import { BookOpen, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BookClubs() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-card p-8 mt-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
        <img loading="lazy" decoding="async" loading="lazy" decoding="async" src="https://images.igdb.com/igdb/image/upload/t_cover_big/co67w0.jpg" alt="Celeste" className="w-48 rounded-xl shadow-2xl border border-separator rotate-[-2deg]" />
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Community Game of the Month
            </span>
            <span className="text-[11px] font-bold text-muted/60">Ends in 12 days</span>
          </div>
          
          <h2 className="text-[32px] font-black text-foreground leading-tight mb-2">Celeste</h2>
          <p className="text-[14px] text-muted/80 max-w-xl leading-relaxed">
            Join 14,208 other players this month in beating the main story of Celeste. Complete the game before the end of the month to unlock the exclusive "Mountain Climber" profile badge and join the developer AMA!
          </p>
          
          <div className="flex items-center gap-4 mt-6">
            <Button className="bg-purple-500 hover:bg-purple-600 text-white border-0 font-bold px-6 h-11 shadow-lg shadow-purple-500/20 cursor-pointer">
              Join the Club — 50% Off
            </Button>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-muted">
              <Users className="h-4 w-4" /> 14.2k joined
            </div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-yellow">
              <Trophy className="h-4 w-4" /> Unique Badge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
