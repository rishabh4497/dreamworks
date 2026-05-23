import { motion } from "motion/react";
import { useState } from "react";
import { Send, UserPlus } from "lucide-react";
import { useFriendActivity, useFriends } from "@/hooks/use-friends";
import { useGames } from "@/hooks/use-games";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import { relativeDate, cn } from "@/lib/utils";
import type { Friend } from "@/lib/types";

const STATUS_COLOR = {
  online: "bg-green",
  "in-game": "bg-positive",
  away: "bg-orange",
  offline: "bg-muted/40",
} as const;

interface ChatLine {
  fromMe: boolean;
  text: string;
  at: string;
}

export function FriendsPage() {
  const friends = useFriends();
  const activity = useFriendActivity();
  const games = useGames();
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [addFriendInput, setAddFriendInput] = useState("");
  const [chatLines, setChatLines] = useState<Record<string, ChatLine[]>>({});
  const [draft, setDraft] = useState("");

  if (friends.isLoading || activity.isLoading) return <LoadingSpinner />;

  const sendMessage = () => {
    if (!chatFriend || !draft.trim()) return;
    const line: ChatLine = { fromMe: true, text: draft.trim(), at: new Date().toISOString() };
    setChatLines((prev) => ({
      ...prev,
      [chatFriend.uid]: [...(prev[chatFriend.uid] ?? []), line],
    }));
    setDraft("");
    // Mock reply
    const replyText = "Got it.";
    setTimeout(() => {
      setChatLines((prev) => ({
        ...prev,
        [chatFriend.uid]: [
          ...(prev[chatFriend.uid] ?? []),
          { fromMe: false, text: replyText, at: new Date().toISOString() },
        ],
      }));
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
                    <img loading="lazy" decoding="async" loading="lazy" decoding="async" src={f.avatarUrl} className="h-9 w-9 rounded-full" alt="" />
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
                    <img loading="lazy" decoding="async" loading="lazy" decoding="async" src={friend.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
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
        title={chatFriend ? `Chat with ${chatFriend.displayName}` : ""}
      >
        {chatFriend && (
          <div className="space-y-3">
            <div className="h-64 overflow-y-auto rounded-xl border border-separator bg-bg p-3 space-y-2">
              {(chatLines[chatFriend.uid] ?? []).length === 0 ? (
                <p className="text-center text-[12px] text-muted/50 mt-20">
                  Say hi — this is a mock chat, replies come from a friendly bot.
                </p>
              ) : (
                (chatLines[chatFriend.uid] ?? []).map((line, i) => (
                  <div
                    key={i}
                    className={cn("flex", line.fromMe ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-1.5 text-[12px]",
                        line.fromMe
                          ? "bg-acid text-background"
                          : "bg-card-active text-foreground/85",
                      )}
                    >
                      {line.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message ${chatFriend.displayName}…`}
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-xl bg-acid px-3 py-2 text-[12px] font-semibold text-background disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
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
