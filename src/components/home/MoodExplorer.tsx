import { Link } from "react-router-dom";
import { motion } from "motion/react";
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
  /** Solid tinted background that bleeds in from one corner. */
  bgClass: string;
  /** Radial-blob class added behind the icon for extra depth. */
  blobClass: string;
}

const MOODS: Mood[] = [
  {
    title: "Cozy night in",
    subtitle: "Warm, slow, deeply chill",
    tags: ["cozy", "relaxing", "casual"],
    icon: Coffee,
    iconClass: "text-orange",
    bgClass: "bg-gradient-to-br from-orange/30 via-orange/10 to-card",
    blobClass: "bg-orange/40",
  },
  {
    title: "Brain burner",
    subtitle: "Puzzles that earn their hours",
    tags: ["puzzle", "strategy", "deck-builder"],
    icon: Brain,
    iconClass: "text-positive",
    bgClass: "bg-gradient-to-br from-positive/35 via-positive/10 to-card",
    blobClass: "bg-positive/40",
  },
  {
    title: "Couch co-op",
    subtitle: "Friends on the same sofa",
    tags: ["local-multiplayer", "coop", "party"],
    icon: Users,
    iconClass: "text-green",
    bgClass: "bg-gradient-to-br from-green/30 via-green/10 to-card",
    blobClass: "bg-green/40",
  },
  {
    title: "Adrenaline rush",
    subtitle: "Fast, loud, twitchy",
    tags: ["fps", "action", "fast-paced"],
    icon: Zap,
    iconClass: "text-red",
    bgClass: "bg-gradient-to-br from-red/30 via-red/10 to-card",
    blobClass: "bg-red/40",
  },
  {
    title: "Story to cry to",
    subtitle: "Narrative gut-punches",
    tags: ["story-rich", "narrative", "emotional"],
    icon: Heart,
    iconClass: "text-cyan",
    bgClass: "bg-gradient-to-br from-cyan/30 via-cyan/10 to-card",
    blobClass: "bg-cyan/40",
  },
  {
    title: "Quick session",
    subtitle: "Twenty minutes, zero ramp-up",
    tags: ["roguelike", "short-sessions", "arcade"],
    icon: Clock,
    iconClass: "text-acid",
    bgClass: "bg-gradient-to-br from-acid/25 via-acid/10 to-card",
    blobClass: "bg-acid/40",
  },
];

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

/**
 * Mood-based discovery grid. Each tile links to a pre-filtered search by tag
 * so users can hop into a curated slice of the catalog without typing. Tiles
 * use bold colored gradients + a soft blob behind the icon to give the
 * section a glossy, magazine-cover feel.
 */
export function MoodExplorer() {
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-[18px] font-bold leading-tight text-foreground">
            In the mood for…
          </h2>
          <p className="mt-0.5 text-[12px] text-muted/70">
            Skip the search — jump straight into a vibe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {MOODS.map((m, idx) => {
          const params = new URLSearchParams({ tags: m.tags.join(",") }).toString();
          const Icon = m.icon;
          return (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE, delay: 0.04 * idx }}
              whileHover={{ y: -3, scale: 1.02 }}
            >
              <Link
                to={`${ROUTES.storeSearch}?${params}`}
                className={cn(
                  "group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl border border-separator p-4 transition-shadow hover:shadow-lg hover:shadow-black/30",
                  m.bgClass,
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full blur-2xl transition-all duration-500 group-hover:scale-125",
                    m.blobClass,
                  )}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-card/85 to-transparent" />

                <div className="relative">
                  <div
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-card/70 backdrop-blur-sm",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", m.iconClass)} />
                  </div>
                </div>

                <div className="relative space-y-0.5">
                  <h3 className="text-[15px] font-bold leading-tight text-foreground">
                    {m.title}
                  </h3>
                  <p className="text-[10.5px] leading-snug text-muted/75">
                    {m.subtitle}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
