import { ThumbsUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useForumsStore } from "@/stores/forums-store";
import { relativeDate } from "@/lib/utils";
import type { ForumReply } from "@/lib/types";

interface ReplyCardProps {
  reply: ForumReply;
}

export function ReplyCard({ reply }: ReplyCardProps) {
  const toggleHelpful = useForumsStore((s) => s.toggleHelpfulReply);

  return (
    <Card className="flex items-start gap-3 p-4">
      <img
        src={reply.authorAvatarUrl}
        alt=""
        className="h-8 w-8 rounded-full bg-card-active object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] font-semibold text-foreground/90">
            {reply.authorName}
          </span>
          <span className="text-[11px] text-muted/50">
            {relativeDate(reply.createdAt)}
          </span>
        </div>
        <p className="mt-1.5 whitespace-pre-line text-[13px] text-foreground/85">
          {reply.body}
        </p>
        <div className="mt-2.5">
          <button
            type="button"
            onClick={() => toggleHelpful(reply.id)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-[3px] text-[11px] font-medium text-muted/70 hover:bg-input hover:text-foreground/80 transition-colors"
          >
            <ThumbsUp className="h-3 w-3" />
            Helpful ({reply.helpfulCount})
          </button>
        </div>
      </div>
    </Card>
  );
}
