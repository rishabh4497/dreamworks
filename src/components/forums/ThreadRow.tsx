import { Lock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, relativeDate } from "@/lib/utils";
import type { ForumThread } from "@/lib/types";

interface ThreadRowProps {
  thread: ForumThread;
  /** Optional sub-label (e.g. game name on the cross-game forums hub). */
  subLabel?: string;
  onClick?: () => void;
}

export function ThreadRow({ thread, subLabel, onClick }: ThreadRowProps) {
  return (
    <button
      onClick={onClick}
      className="block w-full text-left"
      type="button"
    >
      <Card
        className={cn(
          "flex items-start gap-3 p-4 transition-colors hover:bg-card-active",
        )}
      >
        <img
          src={thread.authorAvatarUrl}
          alt=""
          className="h-9 w-9 rounded-full bg-card-active object-cover"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {thread.sticky && <Badge variant="new">Sticky</Badge>}
            {thread.locked && (
              <Badge variant="warn" className="inline-flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Locked
              </Badge>
            )}
            {subLabel && (
              <span className="text-[10px] uppercase tracking-widest text-muted/50">
                {subLabel}
              </span>
            )}
          </div>
          <p className="line-clamp-2 text-[13px] font-semibold text-foreground">
            {thread.title}
          </p>
          <p className="mt-1 line-clamp-1 text-[12px] text-muted/60">
            {thread.body}
          </p>
          <p className="mt-1.5 text-[11px] text-muted/50">
            By {thread.authorName}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 text-right shrink-0">
          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground/80">
            <MessageSquare className="h-3.5 w-3.5 opacity-60" />
            {thread.replyCount}
          </span>
          <span className="text-[11px] text-muted/50">
            {relativeDate(thread.lastActivityAt)}
          </span>
        </div>
      </Card>
    </button>
  );
}
