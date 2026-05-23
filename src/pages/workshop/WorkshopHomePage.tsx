import { motion } from "motion/react";
import { Link, useParams } from "react-router-dom";
import { Search, Download, Filter, Puzzle, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGames } from "@/hooks/use-games";
import { useWorkshopMods } from "@/hooks/use-workshop-mods";
import {
  useWorkshopSubscriptions,
  useToggleWorkshopSubscription,
} from "@/hooks/use-workshop-subscriptions";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

export function WorkshopHomePage() {
  const { gameId } = useParams();
  const { data: games } = useGames();
  const { data: mods = [] } = useWorkshopMods();
  const { data: subscribed = new Set<string>() } = useWorkshopSubscriptions();
  const toggleSub = useToggleWorkshopSubscription();
  const [search, setSearch] = useState("");
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(false);

  const handleSubscribe = (modId: string) => {
    const isSubscribed = subscribed.has(modId);
    toggleSub.mutate(
      { modId, subscribed: !isSubscribed },
      {
        onSuccess: () => {
          if (isSubscribed) {
            toast.info("Unsubscribed from mod");
          } else {
            toast.success("Subscribed! Mod will be downloaded");
          }
        },
        onError: () => {
          toast.error("Couldn't update subscription. Try again.");
        },
      },
    );
  };
  
  const selectedGame = gameId ? games?.find(g => g.id === gameId) : null;
  
  const filteredMods = mods.filter(m => {
    if (gameId && m.gameId !== gameId) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (showSubscribedOnly && !subscribed.has(m.id)) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <section className="relative overflow-hidden rounded-2xl border border-separator bg-card px-5 py-8 md:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 via-[#8b5cf6]/5 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Puzzle className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
                {selectedGame ? `${selectedGame.name} Workshop` : "Dreamworks Workshop"}
              </h1>
              <p className="mt-1 text-[13px] text-muted/80">
                Discover, download, and manage community-created mods for your favorite games.
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex max-w-2xl items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search mods..."
                className="pl-9 h-11 bg-background/50 backdrop-blur-sm"
              />
            </div>
            <Button 
              variant="secondary" 
              className={cn("h-11 px-4 gap-2 transition-colors", showSubscribedOnly && "bg-acid/20 text-acid border-acid/50 hover:bg-acid/30")}
              onClick={() => setShowSubscribedOnly(!showSubscribedOnly)}
            >
              <Filter className="h-4 w-4" /> 
              {showSubscribedOnly ? "My Subs" : "All Mods"}
            </Button>
          </div>
        </div>
      </section>

      {!selectedGame && (
        <section>
          <h2 className="mb-4 text-[15px] font-semibold text-foreground">Filter by Game</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 shelf-scroll">
            {games?.filter(g => mods.some(m => m.gameId === g.id)).map(game => (
              <Link
                key={game.id}
                to={ROUTES.workshopGame(game.id)}
                className="group relative h-20 w-40 shrink-0 overflow-hidden rounded-xl border border-separator transition-colors hover:border-acid/40"
              >
                <img loading="lazy" decoding="async" src={game.headerUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-2 px-2 text-center text-[11px] font-semibold text-foreground">
                  {game.name}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-foreground">
            {showSubscribedOnly ? "Your Subscriptions" : search ? "Search Results" : "Trending Mods"}
          </h2>
          {selectedGame && (
            <Link to={ROUTES.workshop} className="text-[12px] text-acid hover:underline">
              View all games
            </Link>
          )}
        </div>
        
        {filteredMods.length === 0 ? (
          <div className="rounded-2xl border border-separator bg-card p-12 text-center">
            <Puzzle className="mx-auto h-8 w-8 text-muted/30 mb-3" />
            <p className="text-[14px] font-medium text-foreground">No mods found</p>
            <p className="text-[12px] text-muted/60 mt-1">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMods.map(mod => {
              const game = games?.find(g => g.id === mod.gameId);
              return (
                <div key={mod.id} className="group relative overflow-hidden rounded-xl border border-separator bg-card transition-colors hover:bg-card-hover hover:border-acid/30">
                  <div className="aspect-[460/215] w-full overflow-hidden">
                    <img loading="lazy" decoding="async" src={mod.imgUrl} alt={mod.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-[15px] font-semibold text-foreground truncate">{mod.name}</h3>
                    <p className="mt-1 text-[11px] text-muted/70 flex items-center gap-1.5">
                      By <span className="font-medium text-foreground/80">{mod.author}</span>
                      {game && <> · <span>{game.name}</span></>}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-[11px] font-medium text-muted/80">
                        <span className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" /> {(mod.downloads / 1000000).toFixed(1)}M
                        </span>
                        <span className="flex items-center gap-1 text-positive">
                          <ThumbsUp className="h-3 w-3" /> {mod.rating}
                        </span>
                      </div>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleSubscribe(mod.id)}
                        className={cn(
                          "h-7 text-[11px] px-3 border-0 transition-all",
                          subscribed.has(mod.id) 
                            ? "bg-card-active text-muted hover:bg-card-hover" 
                            : "bg-acid/10 text-acid hover:bg-acid/20"
                        )}
                      >
                        {subscribed.has(mod.id) ? "Subscribed" : "Subscribe"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
