import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Cloud, Monitor } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { GameCard } from "@/components/store/GameCard";

export function DreamworksPlusPage() {
  const { data: games } = useGames();
  const navigate = useNavigate();
  const isSubscribed = useAuthStore((s) => s.profile?.isSubscribed);
  const addToCart = useCartStore((s) => s.add);
  
  const [filter, setFilter] = useState<"all" | "cloud" | "local">("all");

  const handleUpgrade = () => {
    addToCart("plus-sub");
    navigate(ROUTES.checkout);
  };

  const includedGames = (games ?? []).filter((g) => g.includedInSubscription);
  const displayedGames = includedGames.filter((g) => {
    if (filter === "cloud") return g.cloudPlayable;
    if (filter === "local") return !g.cloudPlayable;
    return true;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0f2e] via-[#2a134a] to-[#0f0a1c] p-8 text-white shadow-2xl border border-[#a052ff]/30">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <Sparkles className="w-64 h-64 text-[#a052ff]" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#a052ff]/20 px-3 py-1 text-[11px] font-semibold text-[#c99eff] border border-[#a052ff]/30 mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Premium Subscription
          </div>
          <h1 className="text-[36px] font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#c99eff]">
            Dreamworks<span className="text-[#a052ff]">+</span>
          </h1>
          <p className="text-[15px] text-white/70 mb-8 leading-relaxed">
            Unlock instant access to {includedGames.length} premium titles. Play locally with blazing fast downloads, or stream instantly via Cloud Gaming with zero install time.
          </p>
          
          {!isSubscribed ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                onClick={handleUpgrade}
                className="bg-[#a052ff] hover:bg-[#b06df5] text-white px-8 h-12 text-[15px] font-bold shadow-lg shadow-[#a052ff]/30 w-full sm:w-auto transition-all hover:scale-105 border-0"
              >
                Upgrade Now — $14.99/mo
              </Button>
              <span className="text-[12px] text-white/50">Cancel anytime.</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-xl bg-positive/20 px-4 py-3 text-[14px] font-semibold text-positive border border-positive/30">
              You are a Dreamworks+ Member
            </div>
          )}
        </div>
      </section>

      {/* Catalog */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-[20px] font-semibold text-foreground">
            The Catalog <span className="text-muted/60 text-[14px] font-normal ml-2">({displayedGames.length} titles)</span>
          </h2>
          
          <div className="flex bg-input rounded-lg p-1 border border-separator overflow-x-auto">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} icon={<Sparkles className="w-3.5 h-3.5" />} label="All Games" />
            <FilterButton active={filter === "cloud"} onClick={() => setFilter("cloud")} icon={<Cloud className="w-3.5 h-3.5" />} label="Cloud Playable" />
            <FilterButton active={filter === "local"} onClick={() => setFilter("local")} icon={<Monitor className="w-3.5 h-3.5" />} label="Local Install" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedGames.map((game) => (
            <GameCard key={game.id} game={game} width="100%" />
          ))}
        </div>
        {displayedGames.length === 0 && (
          <div className="p-12 text-center text-muted/60 text-[13px] bg-card rounded-xl border border-separator">
            No games found for this filter.
          </div>
        )}
      </section>
    </motion.div>
  );
}

function FilterButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex whitespace-nowrap items-center gap-1.5 px-4 py-1.5 rounded-md text-[12px] font-medium transition-all ${
        active 
          ? "bg-card-active text-foreground shadow-sm border border-separator" 
          : "text-muted hover:text-foreground hover:bg-card-active/50 border border-transparent"
      }`}
    >
      {icon} {label}
    </button>
  );
}
