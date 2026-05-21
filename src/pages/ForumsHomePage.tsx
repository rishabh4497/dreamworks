import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { MessageSquare } from "lucide-react";
import { useRecentThreads } from "@/hooks/use-forums";
import { useGames } from "@/hooks/use-games";
import { ThreadRow } from "@/components/forums/ThreadRow";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { LfgBoard } from "@/components/social/LfgBoard";
import { ROUTES } from "@/lib/routes";

export function ForumsHomePage() {
  const navigate = useNavigate();
  const { data: threads, isLoading } = useRecentThreads();
  const { data: games } = useGames();

  const gameNameById = useMemo(() => {
    const map = new Map<string, string>();
    (games ?? []).forEach((g) => map.set(g.id, g.name));
    return map;
  }, [games]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
          Forums
        </h1>
        <p className="text-[13px] text-muted/60">
          Recent discussions across every game in the catalog.
        </p>
      </header>

      <LfgBoard />

      <h2 className="mb-4 text-[16px] font-semibold text-foreground">Recent discussions</h2>
      {isLoading ? (
        <div className="grid gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (threads ?? []).length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No threads yet"
          description="Once anyone posts in a game's forum, the latest activity will surface here."
        />
      ) : (
        <div className="grid gap-2">
          {(threads ?? []).map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              subLabel={gameNameById.get(thread.gameId)}
              onClick={() =>
                navigate(ROUTES.forumThread(thread.gameId, thread.id))
              }
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
