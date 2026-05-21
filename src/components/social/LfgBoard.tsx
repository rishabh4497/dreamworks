import { useMemo, useState } from "react";
import {
  BookOpen,
  Headphones,
  Plus,
  Shield,
  Users,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGames } from "@/hooks/use-games";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";

interface LfgPost {
  id: string;
  gameId: string;
  game: string;
  author: string;
  type: string;
  desc: string;
  time: string;
  friend: string;
  tags: string[];
}

const SEED_LFG: LfgPost[] = [
  {
    id: "1",
    gameId: "helldivers-2",
    game: "Helldivers 2",
    author: "LibertyPrime",
    type: "Operation",
    desc: "Need 2 for Suicide Mission. Mic required.",
    time: "2m ago",
    friend: "Any friend",
    tags: ["Mic", "Experienced"],
  },
  {
    id: "2",
    gameId: "baldurs-gate-3",
    game: "Baldur's Gate 3",
    author: "TavTheGreat",
    type: "Campaign",
    desc: "Starting fresh Honor Mode run. LF Bard.",
    time: "5m ago",
    friend: "Maya",
    tags: ["Fresh start", "Tryhard"],
  },
  {
    id: "3",
    gameId: "counter-strike-2",
    game: "Counter-Strike 2",
    author: "AimBotz",
    type: "Ranked",
    desc: "Premier 15k+ ELO. Dust 2 only.",
    time: "12m ago",
    friend: "Aarav",
    tags: ["Competitive", "Voice"],
  },
];

const GUIDE_SEEDS = [
  {
    id: "guide-1",
    game: "Elden Ring",
    title: "Early-game bleed route",
    author: "Rishav",
    kind: "Build",
    votes: 128,
  },
  {
    id: "guide-2",
    game: "Cyberpunk 2077",
    title: "Phantom Liberty stealth netrunner",
    author: "Maya",
    kind: "Guide",
    votes: 91,
  },
];

const SESSION_TYPES = ["Co-op", "Ranked", "Raid", "Campaign", "Trade", "Achievement"];
const FRIENDS = ["Any friend", "Maya", "Aarav", "Leo", "Sarah"];

export function LfgBoard() {
  const { data: games = [] } = useGames();
  const [posts, setPosts] = useState(SEED_LFG);
  const [gameId, setGameId] = useState("elden-ring");
  const [type, setType] = useState("Co-op");
  const [friend, setFriend] = useState("Any friend");
  const [mic, setMic] = useState(true);
  const [ranked, setRanked] = useState(false);
  const [description, setDescription] = useState("");
  const [guideDraft, setGuideDraft] = useState("");

  const gameOptions = useMemo(
    () =>
      games.length
        ? games.slice(0, 12).map((game) => ({ id: game.id, name: game.name }))
        : [
            { id: "elden-ring", name: "Elden Ring" },
            { id: "cyberpunk-2077", name: "Cyberpunk 2077" },
          ],
    [games],
  );
  const selectedGame = gameOptions.find((game) => game.id === gameId) ?? gameOptions[0];

  const createPost = () => {
    if (!description.trim()) {
      toast.info("Add a short session note first");
      return;
    }
    const tags = [mic ? "Mic" : "No mic", ranked ? "Ranked" : "Casual"];
    setPosts((current) => [
      {
        id: `lfg-${Date.now()}`,
        gameId: selectedGame.id,
        game: selectedGame.name,
        author: "rishav",
        type,
        desc: description.trim(),
        time: "Just now",
        friend,
        tags,
      },
      ...current,
    ]);
    setDescription("");
    toast.success("LFG post created");
  };

  const createGuide = () => {
    if (!guideDraft.trim()) {
      toast.info("Name the guide before saving it");
      return;
    }
    toast.success(`Guide draft saved: ${guideDraft.trim()}`);
    setGuideDraft("");
  };

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-separator bg-card">
      <div className="flex flex-col gap-3 border-b border-separator bg-card-active/30 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-acid" />
          <h2 className="text-[15px] font-semibold text-foreground">Guides, Parties & LFG</h2>
          <span className="rounded-full border border-acid/20 bg-acid/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-acid">
            Live
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={gameId} onChange={setGameId}>
            {gameOptions.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </Select>
          <Select value={type} onChange={setType}>
            {SESSION_TYPES.map((sessionType) => (
              <option key={sessionType}>{sessionType}</option>
            ))}
          </Select>
          <Select value={friend} onChange={setFriend}>
            {FRIENDS.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="rounded-xl border border-separator/70 bg-card-active/35 p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Need two for boss run, voice preferred..."
                className="h-9 rounded-lg"
              />
              <ToggleChip active={mic} onClick={() => setMic((value) => !value)}>
                <Headphones className="h-3 w-3" />
                Mic
              </ToggleChip>
              <ToggleChip active={ranked} onClick={() => setRanked((value) => !value)}>
                <Shield className="h-3 w-3" />
                Ranked
              </ToggleChip>
              <Button type="button" size="sm" onClick={createPost}>
                <Plus className="h-3.5 w-3.5" />
                Post LFG
              </Button>
            </div>
          </div>

          <div className="divide-y divide-separator">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 px-1 py-3 transition-colors hover:bg-card-hover sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-input">
                  <Shield className="h-4 w-4 text-muted/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[13px] font-semibold text-foreground">{post.game}</span>
                    <span className="text-[11px] font-medium text-acid">{post.type}</span>
                    <span className="text-[10px] text-muted/45">Invite: {post.friend}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-foreground/85">{post.desc}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-muted/60">
                      {post.author} · {post.time}
                    </span>
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-sm border border-separator bg-card-active px-1.5 py-[1px] text-[9px] text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="h-7 px-3 text-[11px]"
                  onClick={() => toast.success(`Party invite sent for ${post.game}`)}
                >
                  Join Party
                </Button>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-separator/70 bg-card-active/35 p-3">
            <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted/60" />
              <h3 className="text-[13px] font-semibold text-foreground">Guides</h3>
            </div>
            <div className="space-y-2">
              {GUIDE_SEEDS.map((guide) => (
                <button
                  key={guide.id}
                  type="button"
                  className="w-full rounded-lg border border-separator bg-card px-3 py-2 text-left transition-colors hover:bg-card-hover"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] font-semibold text-foreground">
                      {guide.title}
                    </span>
                    <span className="text-[10px] text-acid">{guide.kind}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted/55">
                    {guide.game} · {guide.author} · {guide.votes} helpful
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-separator/70 bg-card-active/35 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-muted/60" />
              <h3 className="text-[13px] font-semibold text-foreground">Create Guide</h3>
            </div>
            <Input
              value={guideDraft}
              onChange={(event) => setGuideDraft(event.target.value)}
              placeholder="Guide title or build name"
              className="h-9 rounded-lg"
            />
            <Button type="button" variant="secondary" size="sm" className="mt-2 w-full" onClick={createGuide}>
              Save draft
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-lg border border-separator bg-input px-2.5 text-[11px] text-foreground focus:outline-none"
    >
      {children}
    </select>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors",
        active
          ? "border-acid/40 bg-acid/10 text-acid"
          : "border-separator bg-card text-muted/70 hover:bg-card-hover hover:text-foreground/80",
      )}
    >
      {children}
    </button>
  );
}
