import { Link } from "react-router-dom";
import { Brain, Clock, Coffee, Heart, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface Mood {
  title: string;
  subtitle: string;
  tags: string[];
  icon: LucideIcon;
  /** Color-token utility classes (no raw hex). */
  iconClass: string;
  gradientClass: string;
}

const MOODS: Mood[] = [
  {
    title: "Cozy night in",
    subtitle: "Warm, slow, deeply chill",
    tags: ["cozy", "relaxing", "casual"],
    icon: Coffee,
    iconClass: "text-orange",
    gradientClass: "from-orange/20 via-orange/5 to-transparent",
  },
  {
    title: "Brain burner",
    subtitle: "Puzzles that earn their hours",
    tags: ["puzzle", "strategy", "deck-builder"],
    icon: Brain,
    iconClass: "text-positive",
    gradientClass: "from-positive/25 via-positive/5 to-transparent",
  },
  {
    title: "Couch co-op",
    subtitle: "Friends on the same sofa",
    tags: ["local-multiplayer", "coop", "party"],
    icon: Users,
    iconClass: "text-green",
    gradientClass: "from-green/20 via-green/5 to-transparent",
  },
  {
    title: "Adrenaline rush",
    subtitle: "Fast, loud, twitchy",
    tags: ["fps", "action", "fast-paced"],
    icon: Zap,
    iconClass: "text-red",
    gradientClass: "from-red/20 via-red/5 to-transparent",
  },
  {
    title: "Story to cry to",
    subtitle: "Narrative gut-punches",
    tags: ["story-rich", "narrative", "emotional"],
    icon: Heart,
    iconClass: "text-cyan",
    gradientClass: "from-cyan/20 via-cyan/5 to-transparent",
  },
  {
    title: "Quick session",
    subtitle: "Twenty minutes, zero ramp-up",
    tags: ["roguelike", "short-sessions", "arcade"],
    icon: Clock,
    iconClass: "text-acid",
    gradientClass: "from-acid/15 via-acid/5 to-transparent",
  },
];

/**
 * Mood-based discovery grid. Each tile links to a pre-filtered search by tag
 * so users can hop into a curated slice of the catalog without typing.
 */
export function MoodExplorer() {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[16px] font-semibold text-foreground">In the mood for…</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {MOODS.map((m) => {
          const params = new URLSearchParams({ tags: m.tags.join(",") }).toString();
          const Icon = m.icon;
          return (
            <Link
              key={m.title}
              to={`${ROUTES.storeSearch}?${params}`}
              className={cn(
                "group relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-xl border border-separator bg-card p-4 transition-all hover:scale-[1.02] hover:bg-card-hover",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br",
                  m.gradientClass,
                )}
              />
              <div className="relative">
                <Icon className={cn("h-5 w-5", m.iconClass)} />
              </div>
              <div className="relative">
                <h3 className="text-[16px] font-bold leading-tight text-foreground">
                  {m.title}
                </h3>
                <p className="mt-0.5 text-[11px] text-muted/70">{m.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
