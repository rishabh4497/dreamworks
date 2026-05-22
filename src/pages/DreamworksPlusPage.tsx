import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ChevronRight, Gamepad2, Gift, Flame } from "lucide-react";
import { useGames } from "@/hooks/use-games";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { type GameDetail } from "@/lib/types";
import { useCartStore } from "@/stores/cart-store";
import { GameCard } from "@/components/store/GameCard";

export function DreamworksPlusPage() {
  const { data: games } = useGames();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const isSubscribed = profile?.isSubscribed;
  const addToCart = useCartStore((s) => s.add);
  
  const [filter, setFilter] = useState<"all" | "cloud" | "local">("all");
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);

  const handleUpgrade = () => {
    addToCart("plus-sub");
    navigate(ROUTES.checkout);
  };

  const includedGames = (games as GameDetail[] ?? []).filter((g) => g.includedInSubscription);
  const displayedGames = includedGames.filter((g) => {
    if (filter === "cloud") return g.cloudPlayable;
    if (filter === "local") return !g.cloudPlayable;
    return true;
  });

  // Personalization logic (mocked recommendations based on profile)
  const firstName = profile?.displayName ? profile.displayName.split(" ")[0] : "Gamer";
  const forYouGames = includedGames.slice(0, 4); 

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-24 max-w-7xl mx-auto">
      {/* Welcoming Personalized Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-card border border-separator/50 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-acid/10 via-cyan/5 to-purple-500/10 opacity-50" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan via-acid to-purple-500" />
        
        <div className="relative z-10 p-8 sm:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-16">
          <div className="flex-1 space-y-4 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 rounded-full bg-background/50 backdrop-blur-md px-4 py-1.5 text-[12px] font-bold text-foreground border border-separator/50 shadow-sm"
            >
              <span className="text-xl">👋</span> Welcome to the club, {firstName}!
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-[42px] sm:text-[56px] font-black tracking-tight leading-[1.1] text-foreground"
            >
              Ready for your next <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan to-acid">great adventure?</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="text-[16px] text-muted/80 max-w-lg mx-auto md:mx-0 leading-relaxed font-medium"
            >
              We've curated the ultimate collection of critically acclaimed hits and hidden indie gems. Everything here is yours to play.
            </motion.p>
          </div>
          
          {/* Fun 3D-ish Floating Cards showing profile vibes */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: "spring" }}
            className="hidden md:flex relative w-64 h-64 shrink-0 perspective-1000"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan/20 to-acid/20 rounded-full blur-[60px] animate-pulse" />
            <div className="absolute top-4 left-4 right-4 bottom-4 rounded-2xl bg-card border border-separator shadow-2xl flex flex-col items-center justify-center gap-3 transform rotate-y-[-10deg] rotate-x-[10deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-500">
              {profile?.avatarOptions ? (
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-cyan to-acid flex items-center justify-center font-bold text-2xl text-white shadow-lg">
                  {firstName.slice(0, 2).toUpperCase()}
                </div>
              ) : (
                <img src={profile?.avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full border-4 border-background shadow-lg object-cover" />
              )}
              <div className="text-center">
                <p className="text-[14px] font-bold text-foreground">Dreamworks+ VIP</p>
                <p className="text-[11px] text-muted/80">Access to {includedGames.length} games</p>
              </div>
            </div>
            
            {/* Floating badges */}
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -top-4 -right-4 bg-acid text-black p-2 rounded-xl shadow-lg transform rotate-12">
              <Sparkles className="h-5 w-5" />
            </motion.div>
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-4 -left-4 bg-cyan text-black p-2 rounded-xl shadow-lg transform -rotate-12">
              <Gamepad2 className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-foreground">Handpicked for you, {firstName}</h2>
            <p className="text-[13px] text-muted/70">Based on your recently played games and wishlist.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {forYouGames.map((game, i) => (
            <motion.div 
              key={game.id} 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              onHoverStart={() => setHoveredGame(game.id)}
              onHoverEnd={() => setHoveredGame(null)}
              className="relative group cursor-pointer"
              onClick={() => navigate(ROUTES.gameDetail(game.id))}
            >
              <div className="relative rounded-2xl overflow-hidden border border-separator bg-card shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:border-acid/50 group-hover:-translate-y-1">
                <div className="aspect-[16/9] relative">
                  <img src={game.headerUrl} alt={game.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[16px] font-bold text-white truncate drop-shadow-md">{game.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {game.genres.slice(0, 2).map(g => (
                         <span key={g} className="text-[10px] font-medium text-white/80 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">{g}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {hoveredGame === game.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="bg-card-active px-3 py-3 border-t border-separator/50"
                    >
                      <p className="text-[12px] text-muted/80 line-clamp-2 leading-relaxed">{game.shortDescription}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-acid flex items-center gap-1"><Sparkles className="h-3 w-3" /> 98% Match</span>
                        <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center text-background">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* The Vault */}
      <section className="bg-card-active/30 rounded-3xl p-6 sm:p-10 border border-separator/50">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-[28px] font-bold text-foreground flex items-center gap-3">
              <span className="text-3xl">🗃️</span> The Vault 
            </h2>
            <p className="text-[14px] text-muted/70 mt-1 max-w-xl">Dive into the complete collection. From relaxing simulators to hardcore RPGs, there's always something new to play.</p>
          </div>
          
          <div className="flex bg-background rounded-full p-1.5 border border-separator shadow-inner overflow-x-auto shrink-0">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")} label="All Games" />
            <FilterButton active={filter === "cloud"} onClick={() => setFilter("cloud")} label="☁️ Cloud Ready" />
            <FilterButton active={filter === "local"} onClick={() => setFilter("local")} label="💻 Local Only" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {displayedGames.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
              <GameCard game={game} width="100%" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Friendly Sticky Footer */}
      {!isSubscribed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[500px] z-50">
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, type: "spring", bounce: 0.6 }}
            className="rounded-2xl border-2 border-acid/50 bg-card/95 backdrop-blur-xl shadow-[0_20px_40px_-10px_rgba(var(--color-acid-rgb),0.3)] p-2 pl-5 flex flex-row items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-acid animate-bounce" />
              <div>
                <p className="text-[13px] font-bold text-foreground">Want to play them all?</p>
                <p className="text-[11px] text-muted/80">Join Dreamworks+ today.</p>
              </div>
            </div>
            
            <button 
              onClick={handleUpgrade}
              className="bg-acid text-background px-6 h-12 rounded-xl text-[13px] font-black hover:brightness-110 transition-all active:scale-95 flex items-center gap-2 shadow-lg"
            >
              Get Started
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
        active 
          ? "bg-foreground text-background shadow-md" 
          : "text-muted hover:text-foreground hover:bg-card-active"
      }`}
    >
      {label}
    </button>
  );
}
