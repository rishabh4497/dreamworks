import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

interface ChatBubbleProps {
  message: ChatMessage;
  /** Whether the previous message in the list was from the same author —
   *  controls avatar/name suppression for grouped runs. */
  grouped?: boolean;
  /** Show the time stamp under the bubble. Defaults to true. */
  showTime?: boolean;
}

/**
 * Single message bubble. Renders an avatar column for peer messages and
 * right-aligns user messages, mirroring Discord/Slack conventions.
 *
 * Bubbles fade + nudge up on mount so a fresh reply has a visible cue.
 */
export function ChatBubble({ message, grouped = false, showTime = true }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex w-full items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        grouped ? "mt-1" : "mt-3",
      )}
    >
      {!isUser && (
        <div className="w-7 shrink-0">
          {!grouped && <Avatar message={message} />}
        </div>
      )}

      <div className={cn("flex max-w-[78%] flex-col", isUser ? "items-end" : "items-start")}>
        {!isUser && !grouped && message.authorName && (
          <p className="mb-0.5 ml-0.5 text-[10.5px] font-semibold text-muted/70">
            {message.authorName}
          </p>
        )}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm",
            isUser
              ? "rounded-br-md bg-acid text-background"
              : "rounded-bl-md border border-separator bg-card text-foreground/90",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          {message.attachment && (
            <div className={cn("mt-2 border-t pt-2", isUser ? "border-background/20" : "border-separator/70")}>
              {message.attachment}
            </div>
          )}
        </div>
        {showTime && (
          <p
            className={cn(
              "mt-1 text-[10px] text-muted/45",
              isUser ? "mr-1" : "ml-1",
            )}
          >
            {formatTime(message.at)}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function Avatar({ message }: { message: ChatMessage }) {
  if (message.avatarUrl) {
    return (
      <img
        src={message.avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-7 w-7 rounded-full border border-separator bg-card object-cover"
      />
    );
  }
  const initial = (message.authorName ?? "?").charAt(0).toUpperCase();
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-separator bg-card text-[10px] font-semibold text-muted/80">
      {initial}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const h12 = ((hours + 11) % 12) + 1;
  const mm = String(minutes).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  return `${h12}:${mm} ${ampm}`;
}
