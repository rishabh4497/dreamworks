import { motion } from "motion/react";
import { useState } from "react";
import { UserPlus } from "lucide-react";
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

export function FriendsPage() {
  const friends = useFriends();
  const activity = useFriendActivity();
  const games = useGames();
  const profile = useAuthStore((s) => s.profile);
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [chatLines, setChatLines] = useState<Record<string, ChatMessage[]>>({});
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState<Record<string, boolean>>({});

  if (friends.isLoading || activity.isLoading) return <LoadingSpinner />;

  const sendMessage = () => {
    if (!chatFriend || !draft.trim()) return;
    const fid = chatFriend.uid;
    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: `${fid}-${Date.now()}-me`,
      role: "user",
      text: draft.trim(),
      at: now,
      avatarUrl: profile?.avatarUrl,
      authorName: profile?.displayName ?? "You",
    };
    setChatLines((prev) => ({
      ...prev,
      [fid]: [...(prev[fid] ?? []), userMsg],
    }));
    setDraft("");
    setTyping((prev) => ({ ...prev, [fid]: true }));

    // Mock reply — kept short while the real messaging backend is being wired.
    window.setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `${fid}-${Date.now()}-peer`,
        role: "peer",
        text: pickMockReply(),
        at: new Date().toISOString(),
        avatarUrl: chatFriend.avatarUrl,
        authorName: chatFriend.displayName,
      };
      setChatLines((prev) => ({
        ...prev,
        [fid]: [...(prev[fid] ?? []), replyMsg],
      }));
      setTyping((prev) => ({ ...prev, [fid]: false }));
    }, 900);
  };

  const submitAddFriend = () => {
    const handle = addFriendInput.trim();
    if (!handle) return;
    toast.success(`Friend request sent to ${handle}`);
    setAddFriendInput("");
    setAddFriendOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Friends</h1>
        <button
          onClick={() => setAddFriendOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-acid px-3 py-2 text-[12px] font-semibold text-background hover:brightness-110"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add friend
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div>
          <h2 className="text-[14px] font-semibold text-foreground mb-3">All friends</h2>
          <div className="space-y-1">
            {(friends.data ?? []).map((f) => {
              const game = (games.data ?? []).find((g) => g.id === f.currentGameId);
              return (
                <div
                  key={f.uid}
                  className="flex items-center gap-3 rounded-lg border border-separator bg-card p-3"
                >
                  <div className="relative">
                    <img loading="lazy" decoding="async" src={f.avatarUrl} className="h-9 w-9 rounded-full" alt="" />
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                        STATUS_COLOR[f.status],
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{f.displayName}</p>
                    <p className="text-[11px] text-muted/60 truncate">
                      {f.status === "in-game" && game ? `In-game · ${game.name}` : f.status}
                    </p>
                  </div>
                  <button
                    onClick={() => setChatFriend(f)}
                    className="rounded-md border border-separator bg-card px-2 py-1 text-[10px] text-muted hover:bg-card-active hover:text-foreground/80"
                  >
                    Message
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <aside>
          <h2 className="text-[14px] font-semibold text-foreground mb-3">Recent activity</h2>
          <div className="rounded-xl border border-separator bg-card divide-y divide-separator">
            {(activity.data ?? []).map((a, i) => {
              const friend = (friends.data ?? []).find((f) => f.uid === a.uid);
              const game = (games.data ?? []).find((g) => g.id === a.gameId);
              return (
                <div key={i} className="flex items-center gap-3 p-3">
                  {friend && (
                    <img loading="lazy" decoding="async" src={friend.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                  )}
                  <div className="flex-1 min-w-0 text-[12px]">
                    <p className="text-foreground/80 truncate">
                      <span className="font-medium">{friend?.displayName}</span> {a.payload}
                    </p>
                    {game && (
                      <Link
                        to={ROUTES.gameDetail(game.id)}
                        className="text-muted/60 hover:text-acid"
                      >
                        {game.name}
                      </Link>
                    )}
                  </div>
                  <span className="text-[10px] text-muted/40">{relativeDate(a.at)}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <Modal
        open={!!chatFriend}
        onClose={() => setChatFriend(null)}
        maxWidth="max-w-xl"
        title=""
      >
        {chatFriend && (
          <div className="flex h-[70vh] max-h-[640px] flex-col">
            <header className="mb-3 flex items-center gap-3 border-b border-separator pb-3">
              <div className="relative">
                <img
                  src={chatFriend.avatarUrl}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 rounded-full border border-separator object-cover"
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card",
                    STATUS_COLOR[chatFriend.status],
                  )}
                  aria-hidden
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-foreground">
                  {chatFriend.displayName}
                </p>
                <p className="text-[11px] text-muted/65">
                  {chatFriend.status === "in-game"
                    ? `Playing ${(games.data ?? []).find((g) => g.id === chatFriend.currentGameId)?.name ?? "a game"}`
                    : STATUS_LABEL[chatFriend.status]}
                </p>
              </div>
            </header>

            <ChatThread
              messages={chatLines[chatFriend.uid] ?? []}
              typing={typing[chatFriend.uid]}
              typingAuthor={chatFriend.displayName}
              className="mb-3"
              empty={
                <div className="px-4 text-center">
                  <p className="text-[13px] font-medium text-foreground/80">
                    Say hi to {chatFriend.displayName}
                  </p>
                  <p className="mt-1 text-[11.5px] text-muted/55">
                    Messages are local previews while the chat backend rolls out.
                  </p>
                </div>
              }
            />

            <ChatComposer
              value={draft}
              onChange={setDraft}
              onSend={sendMessage}
              placeholder={`Message ${chatFriend.displayName}…`}
              busy={typing[chatFriend.uid]}
            />
          </div>
        )}
      </Modal>

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
