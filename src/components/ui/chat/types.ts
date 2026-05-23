import type { ReactNode } from "react";

export type ChatRole = "user" | "peer";

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
  /** Optional decoration appended below the text (e.g. inline cards, links). */
  attachment?: ReactNode;
}
