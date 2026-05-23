import { AnimatePresence, motion } from "motion/react";
import { ArrowDown } from "lucide-react";

interface JumpToLatestProps {
  visible: boolean;
  /** Bubble shown above the button if there are unread messages while scrolled. */
  unreadCount?: number;
  onClick: () => void;
}

/**
 * Floating "jump to latest" pill that appears when the user scrolls up — same
 * idiom as Slack / Discord / iMessage. Spawns above the composer and never
 * blocks the last visible bubble.
 */
export function JumpToLatest({ visible, unreadCount = 0, onClick }: JumpToLatestProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          aria-label="Jump to latest message"
          className="pointer-events-auto absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full border border-separator bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground/85 shadow-lg shadow-black/20 hover:bg-card-active"
        >
          <ArrowDown className="h-3 w-3" />
          {unreadCount > 0 ? `${unreadCount} new` : "Latest"}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
