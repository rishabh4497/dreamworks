import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "./markdown";
import { ChatStatus } from "./ChatStatus";
import type { ChatMessage, ChatMode } from "./types";

interface ChatBubbleProps {
  message: ChatMessage;
  mode: ChatMode;
  /** Position in a run of same-author messages. */
  groupPosition: "single" | "first" | "middle" | "last";
  /** Show a delivery receipt under this bubble (peer mode, last user message). */
  showReceipt?: boolean;
  /** Show timestamp under the bubble. */
  showTime?: boolean;
}

/**
 * Single chat bubble.
 *
 * Visuals follow the conventions of iMessage / WhatsApp:
 *   • Same-author runs are tightened (smaller gap, sharper interior corners).
 *   • The last bubble of a run gets a "tail" via a smaller author-side corner.
 *   • Peer avatars + author labels are rendered once per run (at the bottom).
 *
 * In `ai` mode, peer messages drop the bubble entirely and render as
 * full-width prose blocks (ChatGPT-style) with a copy button and markdown
 * support — better for long, structured replies.
 */
export function ChatBubble({
  message,
  mode,
  groupPosition,
  showReceipt = false,
  showTime = true,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const isLast = groupPosition === "single" || groupPosition === "last";
  const isFirst = groupPosition === "single" || groupPosition === "first";

  // AI mode peer messages render as full-width prose blocks. User messages
  // stay as bubbles even in AI mode — keeps the "your turn" visual clear.
  if (mode === "ai" && !isUser) {
    return <AiPeerMessage message={message} isFirst={isFirst} showTime={showTime} />;
  }

  const cornerClasses = bubbleCorners(isUser, groupPosition);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex w-full items-end gap-2",
        isUser ? "flex-row-reverse" : "flex-row",
        // Tight inside a run, more breathing room between runs.
        groupPosition === "first" || groupPosition === "single" ? "mt-3" : "mt-[3px]",
      )}
    >
      {!isUser && (
        <div className="w-7 shrink-0">{isLast && <Avatar message={message} />}</div>
      )}

      <div className={cn("flex max-w-[78%] flex-col", isUser ? "items-end" : "items-start")}>
        {!isUser && isFirst && message.authorName && (
          <p className="mb-0.5 ml-1 text-[10.5px] font-semibold text-muted/70">
            {message.authorName}
          </p>
        )}
        <div
          className={cn(
            "px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm",
            cornerClasses,
            isUser
              ? "bg-acid text-background"
              : "border border-separator bg-card text-foreground/92",
          )}
        >
          {message.replyTo && <ReplyQuote replyTo={message.replyTo} inverted={isUser} />}
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
          {message.attachment && (
            <div
              className={cn(
                "mt-2 border-t pt-2",
                isUser ? "border-background/20" : "border-separator/70",
              )}
            >
              {message.attachment}
            </div>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <Reactions reactions={message.reactions} isUser={isUser} />
        )}

        {(showTime || (showReceipt && isUser && message.status)) && isLast && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1.5",
              isUser ? "mr-1 flex-row-reverse" : "ml-1 flex-row",
            )}
          >
            {showTime && (
              <span className="text-[10px] text-muted/45">{formatTime(message.at)}</span>
            )}
            {showReceipt && isUser && message.status && (
              <ChatStatus status={message.status} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── AI-mode peer message ───────────────────────────────────────────────────

function AiPeerMessage({
  message,
  isFirst,
  showTime,
}: {
  message: ChatMessage;
  isFirst: boolean;
  showTime: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("group/ai flex w-full gap-3", isFirst ? "mt-4" : "mt-1")}
    >
      <div className="w-8 shrink-0">{isFirst && <AiAvatar message={message} />}</div>

      <div className="min-w-0 flex-1">
        {isFirst && message.authorName && (
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[11.5px] font-semibold text-foreground/90">
              {message.authorName}
            </span>
            {showTime && (
              <span className="text-[10px] text-muted/45">{formatTime(message.at)}</span>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-separator/60 bg-card-active/30 px-4 py-3 text-[13.5px] text-foreground/92">
          {message.replyTo && <ReplyQuote replyTo={message.replyTo} inverted={false} />}
          <div className="prose-chat">{renderMarkdown(message.text)}</div>
          {message.attachment && (
            <div className="mt-3 border-t border-separator/60 pt-3">{message.attachment}</div>
          )}
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] text-muted/55 opacity-0 transition-opacity hover:text-foreground/85 group-hover/ai:opacity-100",
              copied && "opacity-100 text-acid",
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────

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

function AiAvatar({ message }: { message: ChatMessage }) {
  if (message.avatarUrl) {
    return (
      <img
        src={message.avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-8 w-8 rounded-full border border-separator bg-card object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-acid/30 bg-acid/10 text-[11px] font-bold text-acid">
      AI
    </div>
  );
}

function ReplyQuote({
  replyTo,
  inverted,
}: {
  replyTo: NonNullable<ChatMessage["replyTo"]>;
  inverted: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-2 rounded-lg border-l-2 px-2 py-1 text-[11.5px]",
        inverted
          ? "border-background/40 bg-background/15 text-background/85"
          : "border-acid/50 bg-acid/5 text-foreground/70",
      )}
    >
      {replyTo.authorName && (
        <p
          className={cn(
            "text-[10px] font-semibold",
            inverted ? "text-background/70" : "text-acid",
          )}
        >
          {replyTo.authorName}
        </p>
      )}
      <p className="line-clamp-2">{replyTo.text}</p>
    </div>
  );
}

function Reactions({
  reactions,
  isUser,
}: {
  reactions: NonNullable<ChatMessage["reactions"]>;
  isUser: boolean;
}) {
  return (
    <div className={cn("mt-1 flex flex-wrap gap-1", isUser ? "justify-end" : "justify-start")}>
      {reactions.map((r) => (
        <span
          key={r.emoji}
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-[1px] text-[10px]",
            r.byMe
              ? "border-acid/40 bg-acid/15 text-acid"
              : "border-separator bg-card text-muted/80",
          )}
        >
          <span className="text-[11px] leading-none">{r.emoji}</span>
          {r.count > 1 && <span>{r.count}</span>}
        </span>
      ))}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function bubbleCorners(
  isUser: boolean,
  position: "single" | "first" | "middle" | "last",
): string {
  // Base: large rounded corners on every side.
  const base = "rounded-[18px]";
  if (position === "single") return base;

  if (isUser) {
    // Author side = bottom-right; tighten the interior corners.
    if (position === "first") return `${base} rounded-br-md`;
    if (position === "middle") return `${base} rounded-tr-md rounded-br-md`;
    return `${base} rounded-tr-md`; // last → keep tail at bottom-right
  }
  // Peer: author side = bottom-left.
  if (position === "first") return `${base} rounded-bl-md`;
  if (position === "middle") return `${base} rounded-tl-md rounded-bl-md`;
  return `${base} rounded-tl-md`; // last
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
