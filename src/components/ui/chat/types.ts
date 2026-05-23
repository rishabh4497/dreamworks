import type { ReactNode } from "react";

export type ChatRole = "user" | "peer";

/**
 * Visual personality of the thread.
 *
 *  - `peer`: iMessage / WhatsApp style. Tight bubbles, tails on the last
 *    bubble of a run, delivery receipts under the latest user message,
 *    avatars rendered once per peer run (at the end).
 *  - `ai`: ChatGPT style. User stays in bubbles, but the AI replies render
 *    as full-width prose blocks with an author header and a copy button.
 *    Light markdown (bold / italic / inline-code / lists / fenced code) is
 *    rendered automatically.
 */
export type ChatMode = "peer" | "ai";

/** Delivery state shown under the user's most recent message in peer mode. */
export type ChatStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface ChatReaction {
  emoji: string;
  count: number;
  byMe?: boolean;
}

export interface ChatReplyContext {
  id: string;
  text: string;
  authorName?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** ISO timestamp. */
  at: string;
  /** Optional avatar URL — falls back to a tinted initial. */
  avatarUrl?: string;
  /** Optional display name (shown above the bubble on peer messages). */
  authorName?: string;
  /** Optional decoration appended below the text (inline cards, chips, links). */
  attachment?: ReactNode;
  /** Delivery state — only consumed for user messages in peer mode. */
  status?: ChatStatus;
  /** Per-message reactions — quick-add via the bubble menu. */
  reactions?: ChatReaction[];
  /** When the message is a reply, the bubble shows a quoted preview. */
  replyTo?: ChatReplyContext;
}
