import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { GameCard } from "@/components/store/GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@/hooks/use-games";
import { useCategories, useTags } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import { Search, Monitor, Command, Terminal, Sparkles, Tag, Ghost, X, Filter } from "lucide-react";

const PLATFORMS = ["windows", "mac", "linux"] as const;

export function SearchPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [genres, setGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [placeholderText, setPlaceholderText] = useState("Find your next adventure...");
  
  useEffect(() => {
    const placeholders = [
      "Find your next adventure...",
      "Search for RPGs...",
      "Looking for co-op?",
      "Explore open worlds...",
      "Find free to play games..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % placeholders.length;
      setPlaceholderText(placeholders[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filters = useMemo(
    () => ({ q, genres, tags, platforms, onSaleOnly, freeOnly }),
    [q, genres, tags, platforms, onSaleOnly, freeOnly],
  );

  // Only search if there's actually a query or filters active
  const hasActiveFilters = q || genres.length > 0 || tags.length > 0 || platforms.length > 0 || onSaleOnly || freeOnly;

  const { data, isLoading } = useSearch(filters);

  // Debounced search-query telemetry — only after the query stabilizes
  // and yielded a result count, so we can compute zero-results %.
  useEffect(() => {
    if (!q || q.length < 2) return;
    const timer = setTimeout(() => {
      void import("@/lib/telemetry").then((m) =>
        m.track("search_query", {
          term: q.trim().toLowerCase(),
          zeroResults: !data || data.length === 0,
          filterCount:
            genres.length +
            tags.length +
            platforms.length +
            (onSaleOnly ? 1 : 0) +
            (freeOnly ? 1 : 0),
        }),
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [q, data, genres.length, tags.length, platforms.length, onSaleOnly, freeOnly]);
  const cats = useCategories();
  const allTags = useTags();

  const toggle = (list: string[], val: string, setter: (n: string[]) => void) => {
    if (list.includes(val)) setter(list.filter((x) => x !== val));
    else setter([...list, val]);
  };

  const clearAllFilters = () => {
    setQ("");
    setGenres([]);
    setTags([]);
    setPlatforms([]);
    setOnSaleOnly(false);
    setFreeOnly(false);
  };

  const getPlatformIcon = (p: string) => {
    switch (p) {
      case "windows": return <Monitor className="h-3.5 w-3.5" />;
      case "mac": return <Command className="h-3.5 w-3.5" />;
      case "linux": return <Terminal className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* Hero Search Area */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full flex flex-col items-center justify-center pt-16 pb-8"
      >
        <div className="relative w-full max-w-3xl px-6">
          <div className="absolute inset-0 bg-cyan/10 blur-3xl rounded-full" />
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-muted/50 group-focus-within:text-cyan transition-colors" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholderText}
              className="w-full h-16 pl-16 pr-14 rounded-full border border-separator bg-card/60 backdrop-blur-xl text-lg text-foreground focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan transition-all shadow-xl"
            />
            {q && (
              <button 
                onClick={() => setQ("")}
                className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/40 transition-colors text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 w-full max-w-5xl px-6 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border",
                showFilters || (hasActiveFilters && !q)
                  ? "bg-foreground text-background border-foreground hover:opacity-90"
                  : "bg-card border-separator text-foreground hover:bg-card-hover"
              )}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && !q ? "Filters Active" : "Filters"}
            </button>
            
            {PLATFORMS.map((p) => (
              <FilterPill
                key={p}
                active={platforms.includes(p)}
                onClick={() => toggle(platforms, p, setPlatforms)}
                icon={getPlatformIcon(p)}
                label={p}
              />
            ))}
            
            <FilterPill
              active={onSaleOnly}
              onClick={() => setOnSaleOnly(!onSaleOnly)}
              icon={<Tag className="h-3.5 w-3.5" />}
              label="On Sale"
            />
            
            <FilterPill
              active={freeOnly}
              onClick={() => setFreeOnly(!freeOnly)}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Free to Play"
            />
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full overflow-hidden"
              >
                <div className="pt-4 pb-2 border-t border-separator mt-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted/50 mb-3 ml-1">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {(cats.data ?? []).map((c) => (
                        <FilterPill
                          key={c.slug}
                          active={genres.includes(c.slug)}
                          onClick={() => toggle(genres, c.slug, setGenres)}
                          label={c.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted/50 mb-3 ml-1">Popular Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {(allTags.data ?? []).slice(0, 14).map((t) => (
                        <FilterPill
                          key={t.slug}
                          active={tags.includes(t.slug)}
                          onClick={() => toggle(tags, t.slug, setTags)}
                          label={t.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-6">
        {!hasActiveFilters ? (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center pt-12 pb-24 text-center space-y-6"
          >
            <div className="h-24 w-24 rounded-full bg-card-active/50 flex items-center justify-center mb-2">
              <Search className="h-10 w-10 text-cyan/70" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Discover Something New</h2>
            <p className="text-muted/70 max-w-md">
              Start typing above to search the entire catalog, or use the filters to narrow down by genre, tags, or platform.
            </p>
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setQ("RPG")}
                className="px-5 py-2 rounded-full border border-separator bg-card hover:bg-card-hover transition-colors text-sm font-medium"
              >
                Try "RPG"
              </button>
              <button 
                onClick={() => setOnSaleOnly(true)}
                className="px-5 py-2 rounded-full border border-separator bg-card hover:bg-card-hover transition-colors text-sm font-medium"
              >
                Browse Sales
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted/60">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                    Searching catalog...
                  </span>
                ) : (
                  <span className="font-medium text-foreground">{data?.length ?? 0} results found</span>
                )}
              </p>
              {hasActiveFilters && (
                <button 
                  onClick={clearAllFilters}
                  className="text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {!isLoading && data?.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-separator rounded-2xl bg-card/20"
              >
                <Ghost className="h-16 w-16 text-muted/30 mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No games found</h3>
                <p className="text-muted/60 max-w-sm mb-6">
                  Our scouts searched everywhere but couldn't find anything matching your criteria.
                </p>
                <button 
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 rounded-full bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
                >
                  Reset Filters
                </button>
              </motion.div>
            ) : (
              <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {isLoading
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
                    ))
                  : (data ?? []).map((g) => (
                      <motion.div key={g.id} variants={item}>
                        <GameCard game={g} width="100%" />
                      </motion.div>
                    ))}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all capitalize border",
        active
          ? "bg-cyan/10 text-cyan border-cyan/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
          : "bg-card text-muted hover:text-foreground hover:bg-card-hover border-separator"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
