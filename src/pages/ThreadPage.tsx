import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronLeft, Lock, ThumbsUp } from "lucide-react";
import { useThread, useThreadReplies } from "@/hooks/use-forums";
import { useGame } from "@/hooks/use-games";
import { ReplyCard } from "@/components/forums/ReplyCard";
import { ReplyComposer } from "@/components/forums/ReplyComposer";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useForumsStore } from "@/stores/forums-store";
import { ROUTES } from "@/lib/routes";
import { relativeDate } from "@/lib/utils";

export function ThreadPage() {
  const { gameId = "", threadId = "" } = useParams();
  const { data: thread, isLoading } = useThread(threadId);
  const { data: replies } = useThreadReplies(threadId);
  const { data: game } = useGame(gameId);
  const toggleHelpfulThread = useForumsStore((s) => s.toggleHelpfulThread);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const prevReplyCountRef = useRef<number>(0);

  // Scroll to the bottom when a new reply lands (count grows).
  useEffect(() => {
    const count = replies?.length ?? 0;
    if (count > prevReplyCountRef.current && prevReplyCountRef.current !== 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevReplyCountRef.current = count;
  }, [replies?.length]);

  if (isLoading) return <LoadingSpinner label="Loading thread…" />;
  if (!thread) {
    return (
      <div className="py-12 text-center text-muted">
        Thread not found.{" "}
        <Link to={ROUTES.forumGame(gameId)} className="text-acid underline">
          Back to forum
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl"
    >
      <Link
        to={ROUTES.forumGame(thread.gameId)}
        className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted/60 hover:text-foreground/80"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to {game?.name ?? "forum"}
      </Link>

      {/* OP */}
      <Card className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {thread.sticky && <Badge variant="new">Sticky</Badge>}
          {thread.locked && (
            <Badge variant="warn" className="inline-flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" /> Locked
            </Badge>
          )}
        </div>
        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
          {thread.title}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <img
            src={thread.authorAvatarUrl}
            alt=""
            className="h-7 w-7 rounded-full bg-card-active object-cover"
          />
          <div className="text-[12px]">
            <p className="font-medium text-foreground/85">{thread.authorName}</p>
            <p className="text-[11px] text-muted/50">
              {relativeDate(thread.createdAt)}
            </p>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-line text-[13px] leading-relaxed text-foreground/85">
          {thread.body}
        </p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => toggleHelpfulThread(thread.id)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[11px] font-medium text-muted/70 hover:bg-input hover:text-foreground/80 transition-colors"
          >
            <ThumbsUp className="h-3 w-3" />
            Helpful ({thread.helpfulCount})
          </button>
        </div>
      </Card>

      {/* Replies */}
      <section className="mt-6">
        <h2 className="mb-3 text-[14px] font-semibold text-foreground">
          {replies?.length ?? 0} repl{(replies?.length ?? 0) === 1 ? "y" : "ies"}
        </h2>
        <div className="space-y-2">
          {(replies ?? []).map((reply) => (
            <ReplyCard key={reply.id} reply={reply} />
          ))}
        </div>
        <div ref={bottomRef} />
      </section>

      {/* Composer (hidden when locked) */}
      <section className="mt-8">
        {thread.locked ? (
          <Card className="flex items-center gap-2 p-4 text-[12px] text-muted/70">
            <Lock className="h-4 w-4 text-muted/50" />
            Locked by moderators — new replies are disabled.
          </Card>
        ) : (
          <ReplyComposer threadId={thread.id} />
        )}
      </section>
    </motion.div>
  );
}
