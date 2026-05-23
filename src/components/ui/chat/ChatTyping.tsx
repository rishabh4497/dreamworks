import { motion } from "motion/react";

interface ChatTypingProps {
  /** Optional name shown above the dots ("Sarah is typing…"). */
  authorName?: string;
  /** Peer avatar for the gutter — keeps the indicator aligned with bubbles. */
  avatarUrl?: string;
}

/**
 * Animated three-dot indicator shown while the peer / AI composes a reply.
 * Aligns to the peer column so the visual rhythm matches a real bubble.
 */
export function ChatTyping({ authorName, avatarUrl }: ChatTypingProps) {
  return (
    <div className="mt-3 flex items-end gap-2">
      <div className="w-7 shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full border border-separator bg-card object-cover opacity-70"
          />
        ) : (
          <div className="h-7 w-7 rounded-full border border-separator bg-card/60" />
        )}
      </div>
      <div className="flex flex-col items-start">
        {authorName && (
          <p className="mb-0.5 ml-1 text-[10.5px] font-semibold text-muted/55">
            {authorName} is typing
          </p>
        )}
        <div className="flex items-center gap-1 rounded-[18px] rounded-bl-md border border-separator bg-card px-3.5 py-2.5 shadow-sm">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block h-1.5 w-1.5 rounded-full bg-muted/70"
              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
