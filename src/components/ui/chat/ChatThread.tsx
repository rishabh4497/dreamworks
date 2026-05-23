import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ChatBubble";
import { ChatTyping } from "./ChatTyping";
import type { ChatMessage } from "./types";

interface ChatThreadProps {
  messages: ChatMessage[];
  /** Show the typing indicator at the bottom of the thread. */
  typing?: boolean;
  /** Display name surfaced in the typing indicator. */
  typingAuthor?: string;
  /** Slot rendered when `messages` is empty. */
  empty?: ReactNode;
  className?: string;
}

/**
 * Scrollable message list. Auto-pins to the bottom whenever the message
 * count or the typing indicator changes — matches every modern chat client
 * (Discord, Slack, iMessage) so users don't have to keep scrolling manually.
 */
export function ChatThread({
  messages,
  typing = false,
  typingAuthor,
  empty,
  className,
}: ChatThreadProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Defer one frame so the new bubble's height is included.
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length, typing]);

  const isEmpty = messages.length === 0;

  return (
    <div
      ref={scrollerRef}
      className={cn(
        "flex-1 overflow-y-auto rounded-xl border border-separator bg-card-active/20 p-4",
        // Pleasant focus ring + scrollbar handled by the global theme tokens.
        className,
      )}
    >
      {isEmpty && empty ? (
        <div className="flex h-full items-center justify-center">{empty}</div>
      ) : (
        <div className="flex flex-col">
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const grouped = Boolean(prev && prev.role === m.role && sameMinute(prev.at, m.at));
            return <ChatBubble key={m.id} message={m} grouped={grouped} />;
          })}
          {typing && <ChatTyping authorName={typingAuthor} />}
        </div>
      )}
    </div>
  );
}

function sameMinute(a: string, b: string): boolean {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return false;
  // Within 90 seconds counts as the same "group" so quick back-to-back
  // messages share an avatar/header.
  return Math.abs(da - db) < 90_000;
}
