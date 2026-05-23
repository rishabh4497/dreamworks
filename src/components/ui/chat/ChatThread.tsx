import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from "react";
import { cn } from "@/lib/utils";
import { ChatBubble } from "./ChatBubble";
import { ChatTyping } from "./ChatTyping";
import { DateSeparator } from "./DateSeparator";
import { JumpToLatest } from "./JumpToLatest";
import type { ChatMessage, ChatMode } from "./types";

interface ChatThreadProps {
  messages: ChatMessage[];
  mode?: ChatMode;
  /** Show the typing indicator at the bottom of the thread. */
  typing?: boolean;
  /** Display name surfaced in the typing indicator. */
  typingAuthor?: string;
  /** Optional avatar url for the typing peer (peer mode only). */
  typingAvatarUrl?: string;
  /** Slot rendered when `messages` is empty. */
  empty?: ReactNode;
  className?: string;
}

const SCROLL_PIN_THRESHOLD = 64;

/**
 * Scrollable conversation surface with iMessage-quality polish.
 *
 *  • Auto-scrolls to the bottom on new messages, but only when the user is
 *    already pinned to the bottom (within `SCROLL_PIN_THRESHOLD`). If they're
 *    reading older messages we never yank them away — a "Jump to latest" pill
 *    appears instead.
 *  • Day boundaries are stamped between bubbles ("Today", "Yesterday", …).
 *  • Same-author runs are grouped: avatars + author name show once per run,
 *    bubble corners tighten between consecutive bubbles for the iMessage look.
 *  • In `ai` mode the AI's bubbles drop the chrome and render markdown +
 *    a copy affordance — see `ChatBubble`'s `AiPeerMessage` branch.
 */
export function ChatThread({
  messages,
  mode = "peer",
  typing = false,
  typingAuthor,
  typingAvatarUrl,
  empty,
  className,
}: ChatThreadProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(true);
  const [unread, setUnread] = useState(0);
  const lastSeenCount = useRef(messages.length);

  // Track scroll position to decide whether to auto-pin.
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    const nearBottom = distanceFromBottom < SCROLL_PIN_THRESHOLD;
    setPinned(nearBottom);
    if (nearBottom) {
      lastSeenCount.current = messages.length;
      setUnread(0);
    }
  };

  // Auto-scroll on new content — useLayoutEffect to avoid the user catching
  // a frame mid-paint where the latest bubble is already in the DOM but the
  // scroll hasn't caught up.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (pinned) {
      el.scrollTop = el.scrollHeight;
      lastSeenCount.current = messages.length;
    } else if (messages.length > lastSeenCount.current) {
      setUnread((u) => u + (messages.length - lastSeenCount.current));
      lastSeenCount.current = messages.length;
    }
  }, [messages.length, typing, pinned]);

  // First mount: always start pinned to the bottom.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const jumpToBottom = () => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setPinned(true);
    setUnread(0);
    lastSeenCount.current = messages.length;
  };

  const isEmpty = messages.length === 0;
  const groupedRows = isEmpty ? [] : buildRows(messages);
  const lastUserIdx = findLastIndex(messages, (m) => m.role === "user");

  return (
    <div className={cn("relative flex-1", className)}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className={cn(
          "h-full overflow-y-auto rounded-xl border border-separator px-4 py-3",
          mode === "peer"
            ? "bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.02),_transparent_70%)] bg-card-active/15"
            : "bg-card-active/10",
        )}
      >
        {isEmpty && empty ? (
          <div className="flex h-full items-center justify-center">{empty}</div>
        ) : (
          <div className="flex flex-col pb-1">
            {groupedRows.map((row, i) => {
              if (row.kind === "separator") {
                return <DateSeparator key={`sep-${i}`} iso={row.iso} />;
              }
              const m = row.message;
              const isLastUser = lastUserIdx === row.index;
              return (
                <Fragment key={m.id}>
                  <ChatBubble
                    message={m}
                    mode={mode}
                    groupPosition={row.position}
                    showReceipt={mode === "peer" && isLastUser}
                    showTime={row.showTime}
                  />
                </Fragment>
              );
            })}
            {typing && <ChatTyping authorName={typingAuthor} avatarUrl={typingAvatarUrl} />}
          </div>
        )}
      </div>

      <JumpToLatest visible={!pinned} unreadCount={unread} onClick={jumpToBottom} />
    </div>
  );
}

// ── Row builder ────────────────────────────────────────────────────────────

type BubbleRow = {
  kind: "bubble";
  index: number;
  message: ChatMessage;
  position: "single" | "first" | "middle" | "last";
  showTime: boolean;
};

type SeparatorRow = { kind: "separator"; iso: string };

type Row = BubbleRow | SeparatorRow;

/**
 * Walks the message array once and emits a flat list of rows ready for render:
 * date separators wherever the day changes, plus bubble rows tagged with their
 * position in a run (`first` / `middle` / `last` / `single`). We compute
 * grouping here so `ChatBubble` stays presentational.
 */
function buildRows(messages: ChatMessage[]): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const prev = messages[i - 1];
    const next = messages[i + 1];

    if (!prev || !sameDay(prev.at, m.at)) {
      rows.push({ kind: "separator", iso: m.at });
    }

    const grouped = (other?: ChatMessage) =>
      Boolean(other && other.role === m.role && sameMinuteWindow(other.at, m.at));

    const prevGrouped = grouped(prev) && sameDay(prev!.at, m.at);
    const nextGrouped = grouped(next) && sameDay(next!.at, m.at);

    const position: BubbleRow["position"] =
      !prevGrouped && !nextGrouped
        ? "single"
        : !prevGrouped && nextGrouped
          ? "first"
          : prevGrouped && nextGrouped
            ? "middle"
            : "last";

    rows.push({
      kind: "bubble",
      index: i,
      message: m,
      position,
      // Time + receipts only on the trailing bubble of a run.
      showTime: position === "single" || position === "last",
    });
  }
  return rows;
}

function sameMinuteWindow(a: string, b: string): boolean {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (!Number.isFinite(da) || !Number.isFinite(db)) return false;
  return Math.abs(da - db) < 90_000;
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function findLastIndex<T>(arr: T[], pred: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
}
