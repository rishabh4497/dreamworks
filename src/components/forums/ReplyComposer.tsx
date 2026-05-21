import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useForumsStore } from "@/stores/forums-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

interface ReplyComposerProps {
  threadId: string;
  /** Called after a successful submit so the page can scroll to the new reply. */
  onPosted?: () => void;
}

const BODY_MIN = 1;
const BODY_MAX = 4000;

export function ReplyComposer({ threadId, onPosted }: ReplyComposerProps) {
  const addReply = useForumsStore((s) => s.addReply);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < BODY_MIN) {
      setError("Reply cannot be empty.");
      return;
    }
    if (trimmed.length > BODY_MAX) {
      setError(`Reply must be ${BODY_MAX} characters or fewer.`);
      return;
    }
    addReply(threadId, trimmed);
    setBody("");
    setError(null);
    toast.success("Reply posted");
    onPosted?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-[12px] font-medium text-foreground/80">
        Reply
      </label>
      <textarea
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Add to the conversation…"
        className={cn(
          "min-h-[100px] w-full resize-y rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15 transition-all",
        )}
        maxLength={BODY_MAX + 16}
      />
      {error && <p className="text-[11px] text-red">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="primary">
          Post reply
        </Button>
      </div>
    </form>
  );
}
