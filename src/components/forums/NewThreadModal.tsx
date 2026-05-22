import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForumsStore } from "@/stores/forums-store";
import { toast } from "@/stores/toast-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { GameId } from "@/lib/types";

interface NewThreadModalProps {
  open: boolean;
  onClose: () => void;
  gameId: GameId;
}

const TITLE_MIN = 3;
const TITLE_MAX = 120;
const BODY_MIN = 5;
const BODY_MAX = 4000;

function validateTitle(t: string): string | null {
  const trimmed = t.trim();
  if (trimmed.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`;
  if (trimmed.length > TITLE_MAX) return `Title must be ${TITLE_MAX} characters or fewer.`;
  return null;
}

function validateBody(b: string): string | null {
  const trimmed = b.trim();
  if (trimmed.length < BODY_MIN) return `Body must be at least ${BODY_MIN} characters.`;
  if (trimmed.length > BODY_MAX) return `Body must be ${BODY_MAX} characters or fewer.`;
  return null;
}

export function NewThreadModal({ open, onClose, gameId }: NewThreadModalProps) {
  const navigate = useNavigate();
  const createThread = useForumsStore((s) => s.createThread);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setBody("");
    setTitleError(null);
    setBodyError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tErr = validateTitle(title);
    const bErr = validateBody(body);
    setTitleError(tErr);
    setBodyError(bErr);
    if (tErr || bErr) return;

    try {
      const thread = await createThread(gameId, title.trim(), body.trim());
      toast.success("Thread posted");
      reset();
      onClose();
      navigate(ROUTES.forumThread(gameId, thread.id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to post thread");
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="New thread">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground/80">
            Title
          </label>
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder={`Between ${TITLE_MIN} and ${TITLE_MAX} characters`}
            maxLength={TITLE_MAX + 8}
            autoFocus
          />
          {titleError && (
            <p className="mt-1 text-[11px] text-red">{titleError}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground/80">
            Body
          </label>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (bodyError) setBodyError(null);
            }}
            placeholder="Share thoughts, ask questions, post screenshots…"
            className={cn(
              "min-h-[140px] w-full resize-y rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15 transition-all",
            )}
            maxLength={BODY_MAX + 16}
          />
          {bodyError && (
            <p className="mt-1 text-[11px] text-red">{bodyError}</p>
          )}
          <p className="mt-1 text-[10px] text-muted/40">
            {body.trim().length} / {BODY_MAX}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            Post thread
          </Button>
        </div>
      </form>
    </Modal>
  );
}
