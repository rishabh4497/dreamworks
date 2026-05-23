import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  MessageSquare,
  Phone,
  Search,
  UserPlus,
  Video,
} from "lucide-react";
import { useFriendActivity, useFriends } from "@/hooks/use-friends";
import { useGames } from "@/hooks/use-games";
import { useAuthStore } from "@/stores/auth-store";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  ChatThread,
  ChatComposer,
  type ChatMessage,
} from "@/components/ui/chat";
import { toast } from "@/stores/toast-store";
import { relativeDate, cn } from "@/lib/utils";
import type { Friend } from "@/lib/types";

const STATUS_COLOR = {
  online: "bg-green",
  "in-game": "bg-positive",
  away: "bg-orange",
  offline: "bg-muted/40",
} as const;

const STATUS_LABEL = {
  online: "Online",
  "in-game": "In-game",
  away: "Away",
  offline: "Offline",
} as const;

const STATUS_RANK = { "in-game": 0, online: 1, away: 2, offline: 3 } as const;

export function FriendsPage() {
  const friends = useFriends();
  const activity = useFriendActivity();
  const games = useGames();
  const profile = useAuthStore((s) => s.profile);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [search, setSearch] = useState("");
  const [chatLines, setChatLines] = useState<Record<string, ChatMessage[]>>({});
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  /** Tracks whether the chat pane is visible on small screens (list ↔ chat). */
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");

  // Build a "last activity preview" per friend so the conversation list
  // mirrors WhatsApp's right-rail (last message line under the name).
  const lastActivityByUid = useMemo(() => {
    const map = new Map<string, { text: string; at: string; gameId?: string }>();
    (activity.data ?? []).forEach((a) => {
      const existing = map.get(a.uid);
      if (!existing || existing.at < a.at) {
        map.set(a.uid, { text: a.payload, at: a.at, gameId: a.gameId });
      }
    });
    return map;
  }, [activity.data]);

  // Friend list ordering — best signal first (in-game/online), tiebreak by
  // newest activity timestamp. Mirrors how messaging apps rank chats.
  const sortedFriends = useMemo(() => {
    const list = [...(friends.data ?? [])];
    list.sort((a, b) => {
      const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (sr !== 0) return sr;
      const at = lastActivityByUid.get(a.uid)?.at ?? "";
      const bt = lastActivityByUid.get(b.uid)?.at ?? "";
      return bt.localeCompare(at);
    });
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter((f) => f.displayName.toLowerCase().includes(needle));
  }, [friends.data, lastActivityByUid, search]);

  const activeFriend = useMemo(
    () => (activeFriendId ? sortedFriends.find((f) => f.uid === activeFriendId) ?? null : null),
    [sortedFriends, activeFriendId],
  );

  if (friends.isLoading || activity.isLoading) return <LoadingSpinner />;

  const openChat = (uid: string) => {
    setActiveFriendId(uid);
    setMobilePane("chat");
  };

  const updateMessageStatus = (
    fid: string,
    msgId: string,
    status: ChatMessage["status"],
  ) => {
    setChatLines((prev) => ({
      ...prev,
      [fid]: (prev[fid] ?? []).map((m) =>
        m.id === msgId ? { ...m, status } : m,
      ),
    }));
  };

  const sendMessage = () => {
    if (!activeFriend || !draft.trim()) return;
    const fid = activeFriend.uid;
    const msgId = `${fid}-${Date.now()}-me`;
    const userMsg: ChatMessage = {
      id: msgId,
      role: "user",
      text: draft.trim(),
      at: new Date().toISOString(),
      avatarUrl: profile?.avatarUrl,
      authorName: profile?.displayName ?? "You",
      status: "sending",
    };
    setChatLines((prev) => ({
      ...prev,
      [fid]: [...(prev[fid] ?? []), userMsg],
    }));
    setDraft("");

    window.setTimeout(() => updateMessageStatus(fid, msgId, "sent"), 150);
    window.setTimeout(() => updateMessageStatus(fid, msgId, "delivered"), 450);
    window.setTimeout(() => {
      updateMessageStatus(fid, msgId, "read");
      setTyping((prev) => ({ ...prev, [fid]: true }));
    }, 700);

    window.setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `${fid}-${Date.now()}-peer`,
        role: "peer",
        text: pickMockReply(),
        at: new Date().toISOString(),
        avatarUrl: activeFriend.avatarUrl,
        authorName: activeFriend.displayName,
      };
      setChatLines((prev) => ({
        ...prev,
        [fid]: [...(prev[fid] ?? []), replyMsg],
      }));
      setTyping((prev) => ({ ...prev, [fid]: false }));
    }, 1600);
  };

  const submitAddFriend = () => {
    const handle = addFriendInput.trim();
    if (!handle) return;
    toast.success(`Friend request sent to ${handle}`);
    setAddFriendInput("");
    setAddFriendOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-[calc(100vh-7rem)] min-h-[560px] flex-col"
    >
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Friends</h1>
          <p className="text-[12px] text-muted/65">
            {sortedFriends.length} friends · {countOnline(sortedFriends)} online
          </p>
        </div>
        <button
          onClick={() => setAddFriendOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-acid px-3 py-2 text-[12px] font-semibold text-background hover:brightness-110"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add friend
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-separator bg-card shadow-sm">
        {/* ── Conversation list ─────────────────────────────────────────── */}
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-r border-separator md:w-[320px]",
            mobilePane === "chat" ? "hidden md:flex" : "flex",
          )}
        >
          <div className="border-b border-separator p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/55" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search friends"
                className="w-full rounded-xl border border-separator bg-input py-2 pl-9 pr-3 text-[12.5px] text-foreground placeholder:text-muted/45 focus:border-acid/40 focus:outline-none focus:ring-1 focus:ring-acid/15"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {sortedFriends.length === 0 ? (
              <p className="p-4 text-center text-[12px] text-muted/55">No matches.</p>
            ) : (
              sortedFriends.map((f) => {
                const last = lastActivityByUid.get(f.uid);
                const game = (games.data ?? []).find(
                  (g) => g.id === (last?.gameId ?? f.currentGameId),
                );
                const subtitle =
                  f.status === "in-game" && game
                    ? `Playing ${game.name}`
                    : last?.text
                      ? last.text
                      : STATUS_LABEL[f.status];
                const isActive = activeFriendId === f.uid;
                return (
                  <button
                    key={f.uid}
                    type="button"
                    onClick={() => openChat(f.uid)}
                    className={cn(
                      "flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "border-acid bg-card-active/60"
                        : "border-transparent hover:bg-card-active/30",
                    )}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={f.avatarUrl}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 rounded-full border border-separator object-cover"
                      />
                      <span
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                          STATUS_COLOR[f.status],
                        )}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-foreground">
                          {f.displayName}
                        </p>
                        {last && (
                          <span className="shrink-0 text-[10px] text-muted/50">
                            {relativeDate(last.at)}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted/65">{subtitle}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Active chat pane ─────────────────────────────────────────── */}
        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            mobilePane === "list" ? "hidden md:flex" : "flex",
          )}
        >
          {!activeFriend ? (
            <EmptyChat onBrowse={() => setMobilePane("list")} />
          ) : (
            <ActiveChatPane
              friend={activeFriend}
              messages={chatLines[activeFriend.uid] ?? []}
              typing={!!typing[activeFriend.uid]}
              draft={draft}
              onDraftChange={setDraft}
              onSend={sendMessage}
              currentGameName={
                (games.data ?? []).find((g) => g.id === activeFriend.currentGameId)?.name
              }
              onBack={() => setMobilePane("list")}
            />
          )}
        </section>
      </div>

      <Modal open={addFriendOpen} onClose={() => setAddFriendOpen(false)} title="Add a friend">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitAddFriend();
          }}
          className="space-y-3"
        >
          <p className="text-[12px] text-muted/70">
            Enter a username or friend code. We'll send a request — no commitment.
          </p>
          <Input
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            placeholder="@username or friend code"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAddFriendOpen(false)}
              className="rounded-xl border border-separator bg-card px-3 py-2 text-[12px] text-muted hover:bg-card-active hover:text-foreground/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!addFriendInput.trim()}
              className="rounded-xl bg-acid px-3 py-2 text-[12px] font-semibold text-background disabled:opacity-40"
            >
              Send request
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

// ── Active chat pane ───────────────────────────────────────────────────────

function ActiveChatPane({
  friend,
  messages,
  typing,
  draft,
  onDraftChange,
  onSend,
  currentGameName,
  onBack,
}: {
  friend: Friend;
  messages: ChatMessage[];
  typing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  currentGameName?: string;
  onBack: () => void;
}) {
  return (
    <>
      <header className="flex items-center gap-3 border-b border-separator px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="rounded-lg p-1.5 text-muted/55 hover:bg-card-active hover:text-foreground/85 md:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="relative shrink-0">
          <img
            src={friend.avatarUrl}
            alt=""
            className="h-10 w-10 rounded-full border border-separator object-cover"
          />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
              STATUS_COLOR[friend.status],
            )}
            aria-hidden
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-foreground">
            {friend.displayName}
          </p>
          <p className="text-[11px] text-muted/65">
            {friend.status === "in-game" && currentGameName
              ? `Playing ${currentGameName}`
              : STATUS_LABEL[friend.status]}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <HeaderIconButton aria-label="Start voice call" disabled>
            <Phone className="h-4 w-4" />
          </HeaderIconButton>
          <HeaderIconButton aria-label="Start video call" disabled>
            <Video className="h-4 w-4" />
          </HeaderIconButton>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <ChatThread
          mode="peer"
          messages={messages}
          typing={typing}
          typingAuthor={friend.displayName}
          typingAvatarUrl={friend.avatarUrl}
          empty={
            <div className="px-4 text-center">
              <p className="text-[13px] font-medium text-foreground/80">
                Say hi to {friend.displayName}
              </p>
              <p className="mt-1 text-[11.5px] text-muted/55">
                Messages are local previews while the chat backend rolls out.
              </p>
            </div>
          }
        />
        <ChatComposer
          value={draft}
          onChange={onDraftChange}
          onSend={onSend}
          placeholder={`Message ${friend.displayName}…`}
          busy={typing}
          autoFocus
          maxLength={2000}
        />
      </div>
    </>
  );
}

function HeaderIconButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted/55 transition-colors hover:bg-card-active hover:text-foreground/85 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted/55"
    >
      {children}
    </button>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyChat({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-acid/10 text-acid">
        <MessageSquare className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-foreground">Pick a conversation</h2>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted/65">
        Tap a friend on the left to start chatting. Your delivery receipts, history, and game
        activity stay with the conversation.
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="mt-4 rounded-xl border border-separator bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground/80 hover:bg-card-active md:hidden"
      >
        Browse friends
      </button>
      <p className="mt-6 text-[10px] uppercase tracking-widest text-muted/40">
        Or jump into a{" "}
        <Link to={ROUTES.store} className="text-acid hover:underline">
          recently added game
        </Link>
      </p>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function countOnline(friends: Friend[]): number {
  return friends.filter((f) => f.status === "online" || f.status === "in-game").length;
}

/**
 * Local preview replies — varies per call so the modal doesn't always echo the
 * exact same string. Replaced by the real messaging service when it lands.
 */
const MOCK_REPLIES = [
  "Got it.",
  "Sounds good — squad up later?",
  "Lol nice.",
  "I'm down. Give me ten.",
  "Yeah, I just saw the patch notes.",
  "Sending an invite now.",
];

function pickMockReply(): string {
  return MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
}
