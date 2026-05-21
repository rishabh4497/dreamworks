import { motion } from "motion/react";
import { Sparkles, Users, type LucideIcon } from "lucide-react";
import { useBehaviorRecs, useFriendRecs, type RecRow } from "@/hooks/use-recommendations";
import { GameCard } from "@/components/store/GameCard";

export function RecommendationsSection() {
  const behavior = useBehaviorRecs(6);
  const friends = useFriendRecs(6);

  if (behavior.length === 0 && friends.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Rail
          icon={Sparkles}
          title="Picked for you"
          empty="Play a few hours and we'll learn what you like."
          rows={behavior}
        />
        <Rail
          icon={Users}
          title="Your friends are playing"
          empty="Add friends to see what they own."
          rows={friends}
        />
      </div>
    </motion.section>
  );
}

interface RailProps {
  icon: LucideIcon;
  title: string;
  empty: string;
  rows: RecRow[];
}

function Rail({ icon: Icon, title, empty, rows }: RailProps) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-acid" />
        <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-separator bg-card p-6 text-center">
          <p className="text-[12px] text-muted/60">{empty}</p>
        </div>
      ) : (
        <div className="shelf-scroll flex gap-3 overflow-x-auto pb-2">
          {rows.map(({ game, reason }) => (
            <GameCard key={game.id} game={game} width={200} reason={reason} />
          ))}
        </div>
      )}
    </div>
  );
}
