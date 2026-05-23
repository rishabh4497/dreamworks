import { motion } from "motion/react";

interface ChatTypingProps {
  /** Optional name shown above the dots ("Sarah is typing…"). */
  authorName?: string;
}

/**
 * Animated three-dot indicator showing the peer is composing a reply.
 * Styled to match the peer bubble so it slots cleanly into a thread.
 */
export function ChatTyping({ authorName }: ChatTypingProps) {
  return (
    <div className="mt-3 flex items-end gap-2">
      <div className="w-7 shrink-0" />
      <div className="flex flex-col items-start">
        {authorName && (
          <p className="mb-0.5 ml-0.5 text-[10.5px] font-semibold text-muted/55">
            {authorName} is typing
          </p>
        )}
        <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-separator bg-card px-3.5 py-2.5">
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
