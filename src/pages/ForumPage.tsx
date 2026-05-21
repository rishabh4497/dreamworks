import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, MessageSquare, Plus } from "lucide-react";
import { useGameThreads } from "@/hooks/use-forums";
import { useGame } from "@/hooks/use-games";
import { ThreadRow } from "@/components/forums/ThreadRow";
import { NewThreadModal } from "@/components/forums/NewThreadModal";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export function ForumPage() {
  const { gameId = "" } = useParams();
  const navigate = useNavigate();
  const { data: game } = useGame(gameId);
  const { data: threads, isLoading } = useGameThreads(gameId);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={ROUTES.forums}
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted/60 hover:text-foreground/80"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All forums
      </Link>

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {game && (
            <img
              src={game.capsuleUrl}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl border border-separator object-cover"
            />
          )}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-muted/50">
              Discussions
            </p>
            <h1 className="truncate text-[22px] font-semibold tracking-tight text-foreground">
              {game?.name ?? "Forum"}
            </h1>
            <p className="mt-1 text-[12px] text-muted/60">
              {threads
                ? `${threads.length} thread${threads.length === 1 ? "" : "s"}`
                : "Loading…"}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          disabled={!gameId}
        >
          <Plus className="h-4 w-4" />
          New thread
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (threads ?? []).length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No threads yet"
          description="Be the first to start a discussion in this forum."
          action={
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              New thread
            </Button>
          }
        />
      ) : (
        <div className="grid gap-2">
          {(threads ?? []).map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              onClick={() =>
                navigate(ROUTES.forumThread(thread.gameId, thread.id))
              }
            />
          ))}
        </div>
      )}

      {gameId && (
        <NewThreadModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          gameId={gameId}
        />
      )}
    </motion.div>
  );
}
