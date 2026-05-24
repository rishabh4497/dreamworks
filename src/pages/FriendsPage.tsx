import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  MessageSquare,
  Phone,
  Search,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import {
  useFriends,
  usePendingFriendRequests,
  useUserSearch,
} from "@/hooks/use-friends";
import {
  chatIdFor,
  useAcceptFriendRequest,
  useChat,
  useChatMessages,
  useDeclineFriendRequest,
  useSendFriendRequest,
  useSendMessage,
} from "@/hooks/use-chat";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import { playChatPing } from "@/lib/notify-dispatch";
import { WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import {
  ChatThread,
  ChatComposer,
  type ChatMessage as UIChatMessage,
} from "@/components/ui/chat";
import { toast } from "@/stores/toast-store";
import { relativeDate, cn } from "@/lib/utils";
import type { ChatMessage, Friend, FriendRequest, UserProfile } from "@/lib/types";

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
  const pending = usePendingFriendRequests();
  const profile = useAuthStore((s) => s.profile);
  const friendsListAutoSignIn = useUiStore((s) => s.settings.friendsListAutoSignIn);
  const updateSettings = useUiStore((s) => s.updateSettings);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mobilePane, setMobilePane] = useState<"list" | "chat">("list");

  const sortedFriends = useMemo(() => {
    const list = [...(friends.data ?? [])];
    list.sort((a, b) => {
      const sr = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (sr !== 0) return sr;
      return a.displayName.localeCompare(b.displayName);
    });
    if (!search.trim()) return list;
    const needle = search.trim().toLowerCase();
    return list.filter((f) => f.displayName.toLowerCase().includes(needle));
  }, [friends.data, search]);

  const activeFriend = useMemo(
    () =>
      activeFriendId ? sortedFriends.find((f) => f.uid === activeFriendId) ?? null : null,
    [sortedFriends, activeFriendId],
  );

  if (friends.isLoading || pending.isLoading) return <LoadingSpinner />;

  const openChat = (uid: string) => {
    setActiveFriendId(uid);
    setMobilePane("chat");
  };

  if (!friendsListAutoSignIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-[calc(100vh-7rem)] min-h-[560px] flex-col items-center justify-center"
      >
        <div className="max-w-md rounded-2xl border border-separator bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-input">
            <WifiOff className="h-7 w-7 text-muted" />
          </div>
          <h1 className="text-[18px] font-semibold text-foreground">You're offline</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted/70">
            Friends list and chat are hidden because "Sign in to friends list on startup" is turned off in Settings.
          </p>
          <button
            type="button"
            onClick={() => updateSettings({ friendsListAutoSignIn: true })}
            className="mt-5 rounded-xl bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:brightness-110"
          >
            Go online
          </button>
        </div>
      </motion.div>
    );
  }

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
            {pending.data.length > 0 && (
              <> · <span className="text-acid">{pending.data.length} pending</span></>
            )}
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

          {pending.data.length > 0 && (
            <PendingRequestsPanel requests={pending.data} />
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {sortedFriends.length === 0 ? (
              <EmptyFriendList onAdd={() => setAddFriendOpen(true)} />
            ) : (
              sortedFriends.map((f) => {
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
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {f.displayName}
                      </p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted/65">
                        {STATUS_LABEL[f.status]}
                      </p>
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
          ) : profile ? (
            <ActiveChatPane
              friend={activeFriend}
              meUid={profile.uid}
              meName={profile.displayName ?? "You"}
              meAvatarUrl={profile.avatarUrl}
              onBack={() => setMobilePane("list")}
            />
          ) : null}
        </section>
      </div>

      <AddFriendModal
        open={addFriendOpen}
        onClose={() => setAddFriendOpen(false)}
        currentUid={profile?.uid}
      />
    </motion.div>
  );
}

// ── Active chat pane ───────────────────────────────────────────────────────

function ActiveChatPane({
  friend,
  meUid,
  meName,
  meAvatarUrl,
  onBack,
}: {
  friend: Friend;
  meUid: string;
  meName: string;
  meAvatarUrl: string;
  onBack: () => void;
}) {
  const chatId = useMemo(() => chatIdFor(meUid, friend.uid), [meUid, friend.uid]);

  // Ensure the chat doc exists (creates it if first message).
  useChat(friend.uid);

  const messagesQuery = useChatMessages(chatId);
  const send = useSendMessage(chatId);
  const [draft, setDraft] = useState("");
  const playSound = useUiStore.getState().settings.playChatSound;
  const lastIncomingIdRef = useLastIncomingId(messagesQuery.data, meUid);

  // Play a chat ping when a new incoming message arrives.
  useEffect(() => {
    if (!lastIncomingIdRef) return;
    if (playSound) playChatPing();
  }, [lastIncomingIdRef, playSound]);

  const onSend = () => {
    const text = draft.trim();
    if (!text || send.isPending) return;
    setDraft("");
    send.mutate(text, {
      onError: () => {
        toast.error("Couldn't send message");
        setDraft(text);
      },
    });
  };

  const uiMessages = useMemo<UIChatMessage[]>(
    () =>
      (messagesQuery.data ?? []).map((m) =>
        toUiMessage(m, meUid, meName, meAvatarUrl, friend),
      ),
    [messagesQuery.data, meUid, meName, meAvatarUrl, friend],
  );

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
          <p className="text-[11px] text-muted/65">{STATUS_LABEL[friend.status]}</p>
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
          messages={uiMessages}
          empty={
            <div className="px-4 text-center">
              <p className="text-[13px] font-medium text-foreground/80">
                Say hi to {friend.displayName}
              </p>
              <p className="mt-1 text-[11.5px] text-muted/55">
                Messages are end-to-end stored in Firestore — both sides see them live.
              </p>
            </div>
          }
        />
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={onSend}
          placeholder={`Message ${friend.displayName}…`}
          busy={send.isPending}
          autoFocus
          maxLength={2000}
        />
      </div>
    </>
  );
}

function toUiMessage(
  m: ChatMessage,
  meUid: string,
  meName: string,
  meAvatarUrl: string,
  friend: Friend,
): UIChatMessage {
  const mine = m.senderUid === meUid;
  return {
    id: m.id,
    role: mine ? "user" : "peer",
    text: m.text,
    at: m.at,
    avatarUrl: mine ? meAvatarUrl : friend.avatarUrl,
    authorName: mine ? meName : friend.displayName,
    // The other side has read this message if they appear in readBy.
    status: mine
      ? m.readBy.includes(friend.uid)
        ? "read"
        : "delivered"
      : undefined,
  };
}

/**
 * Returns the id of the most recent message authored by the other side, so a
 * caller can detect "new incoming message" transitions and play a sound.
 */
function useLastIncomingId(
  messages: ChatMessage[] | undefined,
  meUid: string,
): string | null {
  return useMemo(() => {
    if (!messages) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].senderUid !== meUid) return messages[i].id;
    }
    return null;
  }, [messages, meUid]);
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

// ── Pending requests ───────────────────────────────────────────────────────

function PendingRequestsPanel({ requests }: { requests: FriendRequest[] }) {
  const accept = useAcceptFriendRequest();
  const decline = useDeclineFriendRequest();

  return (
    <div className="border-b border-separator bg-card-active/30 px-3 py-2.5">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-widest text-muted/55">
        Pending requests
      </p>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.uid} className="flex items-center gap-2.5">
            <img
              src={r.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full border border-separator object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-semibold text-foreground">
                {r.displayName}
              </p>
              <p className="text-[10.5px] text-muted/55">
                Sent {relativeDate(r.createdAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                accept.mutate(r.uid, {
                  onSuccess: () => toast.success(`You and ${r.displayName} are now friends`),
                  onError: () => toast.error("Couldn't accept request"),
                })
              }
              disabled={accept.isPending}
              className="rounded-lg bg-acid px-2.5 py-1 text-[11px] font-semibold text-background hover:brightness-110 disabled:opacity-40"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() =>
                decline.mutate(r.uid, {
                  onError: () => toast.error("Couldn't decline"),
                })
              }
              disabled={decline.isPending}
              className="rounded-lg border border-separator px-2.5 py-1 text-[11px] text-muted hover:bg-card-active hover:text-foreground/80"
            >
              Decline
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Add friend modal ───────────────────────────────────────────────────────

function AddFriendModal({
  open,
  onClose,
  currentUid,
}: {
  open: boolean;
  onClose: () => void;
  currentUid: string | undefined;
}) {
  const [input, setInput] = useState("");
  const term = input.trim();
  const search = useUserSearch(term);
  const send = useSendFriendRequest();

  const submit = (user: UserProfile) => {
    if (!currentUid || user.uid === currentUid) return;
    send.mutate(user.uid, {
      onSuccess: () => {
        toast.success(`Friend request sent to ${user.displayName}`);
        setInput("");
        onClose();
      },
      onError: () => toast.error("Couldn't send request"),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a friend">
      <div className="space-y-3">
        <p className="text-[12px] text-muted/70">
          Search by display name or email. They'll get a pending request to accept.
        </p>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name or email"
          autoFocus
        />

        <div className="min-h-[120px] max-h-[260px] overflow-y-auto rounded-xl border border-separator">
          {!term ? (
            <p className="px-3 py-6 text-center text-[12px] text-muted/55">
              Start typing to search.
            </p>
          ) : search.isLoading ? (
            <p className="px-3 py-6 text-center text-[12px] text-muted/55">Searching…</p>
          ) : (search.data ?? []).length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-muted/55">
              No users match "{term}".
            </p>
          ) : (
            <ul className="divide-y divide-separator/60">
              {(search.data ?? []).map((u) => (
                <li
                  key={u.uid}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-card-active/30"
                >
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full border border-separator object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-foreground">
                      {u.displayName}
                    </p>
                    <p className="truncate text-[10.5px] text-muted/55">{u.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => submit(u)}
                    disabled={send.isPending}
                    className="rounded-lg bg-acid px-2.5 py-1 text-[11px] font-semibold text-background hover:brightness-110 disabled:opacity-40"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-separator bg-card px-3 py-2 text-[12px] text-muted hover:bg-card-active hover:text-foreground/80"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Empty states ───────────────────────────────────────────────────────────

function EmptyChat({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-acid/10 text-acid">
        <MessageSquare className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold text-foreground">Pick a conversation</h2>
      <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted/65">
        Tap a friend on the left to start chatting. Messages are persisted in Firestore and update live for both sides.
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

function EmptyFriendList({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-acid/10 text-acid">
        <Users className="h-6 w-6" />
      </div>
      <p className="mt-4 text-[13px] font-semibold text-foreground/85">No friends yet</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted/65">
        Find someone by display name or email to send your first request.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-acid px-3 py-1.5 text-[11.5px] font-semibold text-background hover:brightness-110"
      >
        <UserPlus className="h-3.5 w-3.5" /> Add friend
      </button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function countOnline(friends: Friend[]): number {
  return friends.filter((f) => f.status === "online" || f.status === "in-game").length;
}
