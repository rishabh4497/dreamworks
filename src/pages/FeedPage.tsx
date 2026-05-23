import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Image as ImageIcon,
  Tag,
  X,
  Search,
  TrendingUp,
  UserPlus,
  UserCheck,
  Users,
  Filter,
  Newspaper,
  MessageSquare,
  Sparkles,
  Flame,
  Globe,
} from "lucide-react";
import { useFeedStore } from "@/stores/feed-store";
import { useGames } from "@/hooks/use-games";
import { useNews } from "@/hooks/use-news";
import { useRecentThreads } from "@/hooks/use-forums";
import { useFollowSuggestions } from "@/hooks/use-follow-suggestions";
import { usePostImagePresets } from "@/hooks/use-post-image-presets";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThreadRow } from "@/components/forums/ThreadRow";
import { LfgBoard } from "@/components/social/LfgBoard";
import { ROUTES } from "@/lib/routes";
import { cn, relativeDate, formatDate } from "@/lib/utils";

// Simple custom component to render user avatars easily
function ProfileAvatar({
  avatarUrl,
  avatarOptions,
  size = 36,
  className = "",
}: {
  avatarUrl: string;
  avatarOptions?: any;
  size?: number;
  className?: string;
}) {
  if (avatarOptions) {
    return <UserAvatar options={avatarOptions} size={size} className={className} />;
  }
  return (
    <img
      src={avatarUrl}
      alt="User Avatar"
      className={cn("rounded-full object-cover shrink-0 bg-card-active border border-separator/40", className)}
      style={{ width: size, height: size }}
    />
  );
}

// Function to format post body text, highlighting hashtags and game references
function formatPostText(text: string) {
  const words = text.split(/(\s+)/);
  return words.map((word, idx) => {
    if (word.startsWith("#")) {
      return (
        <span key={idx} className="text-acid font-semibold cursor-pointer hover:underline">
          {word}
        </span>
      );
    }
    if (word.startsWith("@")) {
      return (
        <span key={idx} className="text-cyan font-medium cursor-pointer hover:underline">
          {word}
        </span>
      );
    }
    return word;
  });
}

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function getLivePlayers(game: any): number {
  if (game.comingSoon) return 0;
  const jitter = (hashId(game.id) % 8000);
  return Math.max(1500, 250_000 - (game.salesRank || 1) * 4000 + jitter);
}

export function FeedPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "feed";
  const navigate = useNavigate();

  // Stores and hooks data
  const { posts, createPost, toggleLikePost, toggleRepostPost, addReply } = useFeedStore();
  const hydrateFeed = useFeedStore((s) => s.hydrate);
  const feedLoaded = useFeedStore((s) => s.loaded);
  useEffect(() => {
    if (!feedLoaded) void hydrateFeed();
  }, [feedLoaded, hydrateFeed]);
  const { data: games = [] } = useGames();
  const { data: news = [], isLoading: newsLoading } = useNews();
  const { data: threads = [], isLoading: threadsLoading } = useRecentThreads();
  const { data: followSuggestions = [] } = useFollowSuggestions();
  const { data: postImagePresets = [] } = usePostImagePresets();

  // Component UI States
  const [composerText, setComposerText] = useState("");
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedPresetImage, setSelectedPresetImage] = useState<string | null>(null);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newCommentTexts, setNewCommentTexts] = useState<Record<string, string>>({});
  const [filterGameId, setFilterGameId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // Who to Follow following states (in-memory mock toggles)
  const [following, setFollowing] = useState<Record<string, boolean>>({
    "@rockstargames": true,
    "@fromsoftware": false,
    "@hadesgame": false,
    "@ign": true,
  });

  const handleToggleFollow = (handle: string) => {
    setFollowing((prev) => ({ ...prev, [handle]: !prev[handle] }));
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    createPost(
      composerText,
      selectedGameId || undefined,
      selectedPresetImage || undefined
    );

    // Reset composer states
    setComposerText("");
    setSelectedGameId("");
    setSelectedPresetImage(null);
    setShowPresetPicker(false);
  };

  const handleAddReply = (postId: string) => {
    const text = newCommentTexts[postId];
    if (!text || !text.trim()) return;

    addReply(postId, text);
    setNewCommentTexts((prev) => ({ ...prev, [postId]: "" }));
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Filter posts based on Game ID and search query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Game tag filter
      if (filterGameId && post.gameId !== filterGameId) return false;

      // Keyword search filter
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const contentMatch = post.content.toLowerCase().includes(query);
        const authorMatch = post.authorName.toLowerCase().includes(query) || post.authorHandle.toLowerCase().includes(query);
        const gameMatch = post.gameId ? post.gameId.replace(/-/g, " ").includes(query) : false;
        return contentMatch || authorMatch || gameMatch;
      }

      return true;
    });
  }, [posts, filterGameId, searchText]);

  const gameMap = useMemo(() => {
    const map = new Map<string, typeof games[0]>();
    games.forEach((g) => map.set(g.id, g));
    return map;
  }, [games]);

  const trendingGamesList = useMemo(() => {
    // Return top 5 games for trending list
    return games.slice(0, 5);
  }, [games]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto"
    >
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-acid" />
            Gaming Feed
          </h1>
          <p className="text-[13px] text-muted/60">
            A social space for live chat, trending news, and forum discussions.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-card/60 p-1 rounded-xl border border-separator/40 shrink-0 self-start sm:self-center">
          <button
            onClick={() => handleTabChange("feed")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all",
              activeTab === "feed"
                ? "bg-card-active text-foreground shadow-sm font-semibold border border-separator/50"
                : "text-muted hover:text-foreground/80"
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            Social Feed
          </button>
          <button
            onClick={() => handleTabChange("news")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all",
              activeTab === "news"
                ? "bg-card-active text-foreground shadow-sm font-semibold border border-separator/50"
                : "text-muted hover:text-foreground/80"
            )}
          >
            <Newspaper className="h-3.5 w-3.5" />
            Gaming News
          </button>
          <button
            onClick={() => handleTabChange("forums")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all",
              activeTab === "forums"
                ? "bg-card-active text-foreground shadow-sm font-semibold border border-separator/50"
                : "text-muted hover:text-foreground/80"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Forums
          </button>
          <button
            onClick={() => handleTabChange("lfg")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg transition-all",
              activeTab === "lfg"
                ? "bg-card-active text-foreground shadow-sm font-semibold border border-separator/50"
                : "text-muted hover:text-foreground/80"
            )}
          >
            <Users className="h-3.5 w-3.5" />
            LFG
          </button>
        </div>
      </header>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Main Column */}
        <main className="space-y-4">
          <AnimatePresence mode="wait">
            
            {/* 1. SOCIAL FEED TAB */}
            {activeTab === "feed" && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4"
              >
                {/* Composer */}
                <Card className="p-4 bg-card/60 backdrop-blur-sm border-separator/60">
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <div className="flex gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-cyan to-acid flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md shadow-acid/10">
                        RI
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="What's happening in gaming? Share a thought or screenshot..."
                          value={composerText}
                          onChange={(e) => setComposerText(e.target.value)}
                          rows={3}
                          className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted/50 resize-none outline-none focus:ring-0 leading-relaxed border-none p-0"
                        />

                        {/* Selected Preset Image Preview */}
                        {selectedPresetImage && (
                          <div className="relative mt-2 rounded-xl overflow-hidden border border-separator w-fit max-w-full">
                            <img
                              src={selectedPresetImage}
                              alt="Selected Attachment"
                              className="max-h-48 object-cover rounded-xl"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedPresetImage(null)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-separator/40 pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Attach Preset Image Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowPresetPicker(!showPresetPicker)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all",
                            selectedPresetImage
                              ? "border-cyan/30 bg-cyan/10 text-cyan"
                              : "border-separator hover:bg-card-active text-muted/80 hover:text-foreground"
                          )}
                        >
                          <ImageIcon className="h-3.5 w-3.5" />
                          {selectedPresetImage ? "Screenshot Attached" : "Attach Screenshot"}
                        </button>

                        {/* Game Tag Dropdown */}
                        <div className="flex items-center gap-1 border border-separator rounded-lg px-2 py-1.5 bg-input/50 text-[11px] text-muted">
                          <Tag className="h-3 w-3" />
                          <select
                            value={selectedGameId}
                            onChange={(e) => setSelectedGameId(e.target.value)}
                            className="bg-transparent outline-none cursor-pointer text-foreground font-medium max-w-[130px] overflow-ellipsis"
                          >
                            <option value="">Tag a game...</option>
                            {games.map((game) => (
                              <option key={game.id} value={game.id}>
                                {game.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={!composerText.trim()}
                        variant="primary"
                        size="sm"
                        className="rounded-lg shadow-sm"
                      >
                        <Send className="h-3 w-3 text-background" />
                        Post Feed
                      </Button>
                    </div>

                    {/* Screenshot Preset Picker Drawer */}
                    <AnimatePresence>
                      {showPresetPicker && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-separator/35 pt-3"
                        >
                          <p className="text-[10px] uppercase font-bold tracking-wider text-muted/50 mb-2">
                            Select Gaming Screenshot to Share
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {postImagePresets.map((img) => (
                              <button
                                key={img.label}
                                type="button"
                                onClick={() => {
                                  setSelectedPresetImage(img.url);
                                  setShowPresetPicker(false);
                                }}
                                className={cn(
                                  "group relative aspect-video rounded-lg overflow-hidden border transition-all focus:outline-none",
                                  selectedPresetImage === img.url
                                    ? "border-acid scale-95 shadow shadow-acid/20"
                                    : "border-separator hover:border-muted/50"
                                )}
                              >
                                <img
                                  src={img.url}
                                  alt={img.label}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                                  <span className="text-[8px] text-white font-medium truncate block w-full text-left">
                                    {img.label}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </Card>

                {/* Filter Banner */}
                {filterGameId && (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-acid/20 bg-acid/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-[12px] text-acid font-semibold">
                      <Filter className="h-4 w-4" />
                      <span>Showing posts tagged with "{gameMap.get(filterGameId)?.name}"</span>
                    </div>
                    <button
                      onClick={() => setFilterGameId(null)}
                      className="text-[10px] uppercase font-bold text-muted hover:text-foreground flex items-center gap-1"
                    >
                      Clear Filter
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Feed list */}
                <div className="space-y-3">
                  {filteredPosts.length === 0 ? (
                    <div className="py-12 text-center rounded-xl border border-separator/40 bg-card/30">
                      <Globe className="h-8 w-8 text-muted/30 mx-auto mb-2" />
                      <p className="text-[13px] text-muted/60">No posts matches your filter or search keywords.</p>
                      <button
                        onClick={() => {
                          setFilterGameId(null);
                          setSearchText("");
                        }}
                        className="mt-2 text-[11px] text-acid font-medium underline"
                      >
                        Reset filters and search
                      </button>
                    </div>
                  ) : (
                    filteredPosts.map((post) => {
                      const taggedGame = post.gameId ? gameMap.get(post.gameId) : null;
                      const isCommentsOpen = !!expandedComments[post.id];

                      return (
                        <Card key={post.id} className="p-4 hover:border-separator/90 transition-all border-separator/50 bg-card/45">
                          {/* Post Header */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex gap-2.5">
                              <ProfileAvatar
                                avatarUrl={post.authorAvatarUrl}
                                avatarOptions={post.authorAvatarOptions}
                                size={36}
                              />
                              <div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-[13px] font-semibold text-foreground/90">
                                    {post.authorName}
                                  </span>
                                  <span className="text-[11px] text-muted/50">
                                    {post.authorHandle}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted/40 font-medium">
                                  {relativeDate(post.createdAt)}
                                </p>
                              </div>
                            </div>

                            {/* Tagged Game Badge */}
                            {taggedGame && (
                              <button
                                onClick={() => setFilterGameId(post.gameId || null)}
                                className="group shrink-0 flex items-center gap-1 rounded-md px-1.5 py-0.5 bg-input border border-separator hover:border-cyan/30 text-[10px] text-muted/80 hover:text-cyan transition-all"
                              >
                                <Tag className="h-2.5 w-2.5 group-hover:scale-105" />
                                <span className="font-semibold truncate max-w-[100px]">{taggedGame.name}</span>
                              </button>
                            )}
                          </div>

                          {/* Body Content */}
                          <p className="text-[13px] text-foreground/85 leading-relaxed whitespace-pre-wrap pl-1 mb-2.5">
                            {formatPostText(post.content)}
                          </p>

                          {/* Embedded Post Image */}
                          {post.imageUrl && (
                            <div className="rounded-xl overflow-hidden border border-separator/40 mb-3 bg-input">
                              <img
                                src={post.imageUrl}
                                alt="Post media"
                                referrerPolicy="no-referrer"
                                className="w-full max-h-[380px] object-cover hover:scale-[1.01] transition-transform duration-300"
                              />
                            </div>
                          )}

                          {/* Action Footer */}
                          <div className="border-t border-separator/30 pt-2 flex items-center gap-6">
                            {/* Like Action */}
                            <button
                              onClick={() => toggleLikePost(post.id)}
                              className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium transition-all group py-1 px-2 rounded-md hover:bg-card-active",
                                post.likedByMe
                                  ? "text-red font-semibold"
                                  : "text-muted hover:text-foreground"
                              )}
                            >
                              <Heart
                                className={cn(
                                  "h-3.5 w-3.5 transition-transform duration-200 group-active:scale-125",
                                  post.likedByMe ? "fill-red text-red animate-none" : "text-muted/70 hover:text-foreground"
                                )}
                              />
                              <span>{post.likes}</span>
                            </button>

                            {/* Repost Action */}
                            <button
                              onClick={() => toggleRepostPost(post.id)}
                              className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium transition-all py-1 px-2 rounded-md hover:bg-card-active",
                                post.repostedByMe
                                  ? "text-positive font-semibold"
                                  : "text-muted hover:text-foreground"
                              )}
                            >
                              <Repeat2
                                className={cn(
                                  "h-3.5 w-3.5",
                                  post.repostedByMe ? "text-positive" : "text-muted/70 hover:text-foreground"
                                )}
                              />
                              <span>{post.reposts}</span>
                            </button>

                            {/* Comment Action */}
                            <button
                              onClick={() => toggleComments(post.id)}
                              className={cn(
                                "flex items-center gap-1.5 text-[11px] font-medium text-muted hover:text-foreground py-1 px-2 rounded-md hover:bg-card-active transition-all",
                                isCommentsOpen && "text-foreground font-semibold"
                              )}
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-muted/70 hover:text-foreground" />
                              <span>{post.replies.length}</span>
                            </button>
                          </div>

                          {/* Expanded Comments Drawer */}
                          <AnimatePresence>
                            {isCommentsOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-3 border-t border-separator/30 pt-3 space-y-3"
                              >
                                {/* List of replies */}
                                {post.replies.length > 0 && (
                                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                    {post.replies.map((reply) => (
                                      <div key={reply.id} className="flex gap-2.5 p-2 rounded-xl bg-card border border-separator/35">
                                        <ProfileAvatar
                                          avatarUrl={reply.authorAvatarUrl}
                                          avatarOptions={reply.authorAvatarOptions}
                                          size={26}
                                        />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-baseline justify-between mb-0.5">
                                            <div className="flex items-baseline gap-1.5">
                                              <span className="text-[11px] font-semibold text-foreground">
                                                {reply.authorName}
                                              </span>
                                              <span className="text-[9px] text-muted/55">
                                                {reply.authorHandle}
                                              </span>
                                            </div>
                                            <span className="text-[9px] text-muted/40">
                                              {relativeDate(reply.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-[11.5px] text-foreground/80 leading-relaxed">
                                            {formatPostText(reply.content)}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Write a reply composer */}
                                <div className="flex items-center gap-2 mt-2">
                                  <input
                                    type="text"
                                    placeholder="Write a comment..."
                                    value={newCommentTexts[post.id] || ""}
                                    onChange={(e) =>
                                      setNewCommentTexts((prev) => ({
                                        ...prev,
                                        [post.id]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleAddReply(post.id);
                                      }
                                    }}
                                    className="flex-1 rounded-lg border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground placeholder:text-muted/50 focus:outline-none focus:border-cyan/40"
                                  />
                                  <button
                                    onClick={() => handleAddReply(post.id)}
                                    disabled={!(newCommentTexts[post.id]?.trim())}
                                    className="p-2 rounded-lg bg-card-active border border-separator hover:bg-input text-cyan hover:text-cyan disabled:opacity-40"
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Card>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}

            {/* 2. NEWS TAB */}
            {activeTab === "news" && (
              <motion.div
                key="news"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newsLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-56 bg-card-active/30 rounded-xl animate-pulse" />
                    ))
                  ) : news.length === 0 ? (
                    <div className="py-12 text-center col-span-2 text-muted">
                      No news updates found.
                    </div>
                  ) : (
                    news.map((article) => (
                      <button
                        key={article.slug}
                        onClick={() => navigate(ROUTES.newsArticle(article.slug))}
                        className="group flex flex-col text-left overflow-hidden rounded-xl border border-separator bg-card hover:bg-card-hover transition-colors"
                      >
                        <div className="relative aspect-video w-full overflow-hidden shrink-0">
                          <img
                            src={article.heroUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        </div>
                        <div className="p-3.5 flex flex-col flex-1">
                          <p className="text-[9px] uppercase font-bold tracking-widest text-acid">
                            {article.tags.join(" · ")}
                          </p>
                          <p className="mt-1.5 text-[13.5px] font-semibold text-foreground leading-snug line-clamp-2">
                            {article.title}
                          </p>
                          <p className="mt-1 text-[11.5px] text-muted/65 line-clamp-2 leading-relaxed flex-1">
                            {article.excerpt}
                          </p>
                          <p className="mt-3 text-[10px] text-muted/40 font-medium pt-2 border-t border-separator/40">
                            {article.authorName} · {formatDate(article.publishedAt)}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* 3. FORUMS TAB */}
            {activeTab === "forums" && (
              <motion.div
                key="forums"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-separator/40 pb-2.5">
                  <h2 className="text-[14px] font-semibold text-foreground/90">
                    Recent Discussions across Games
                  </h2>
                  <span className="text-[11px] text-muted/50">
                    Total {threads.length} threads
                  </span>
                </div>

                {threadsLoading ? (
                  <div className="grid gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 bg-card-active/30 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : threads.length === 0 ? (
                  <div className="py-12 text-center text-muted">
                    No discussions created yet. Click a game from store to start one.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {threads.map((thread) => (
                      <ThreadRow
                        key={thread.id}
                        thread={thread}
                        subLabel={gameMap.get(thread.gameId)?.name}
                        onClick={() => navigate(ROUTES.forumThread(thread.gameId, thread.id))}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "lfg" && (
              <motion.div
                key="lfg"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
              >
                <LfgBoard />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Right Sidebar Widgets */}
        <aside className="space-y-6 hidden lg:block">
          
          {/* Widget 1: Search */}
          <Card className="p-3 border-separator/60 bg-card/65 backdrop-blur-sm">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted/50" />
              <input
                type="text"
                placeholder="Search feed, games or tags..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full rounded-lg border border-separator bg-input pl-8 pr-7 py-1.5 text-[12px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-cyan/40"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-2.5 top-2.5 text-muted hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </Card>

          {/* Widget 2: Trending Games */}
          <Card className="p-4 border-separator/60 bg-card/65 backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-separator/40">
              <Flame className="h-4 w-4 text-orange" />
              <h3 className="text-[12.5px] font-semibold text-foreground/90">
                Trending Games
              </h3>
            </div>
            <div className="space-y-2.5">
              {trendingGamesList.map((game, idx) => {
                const isSelected = filterGameId === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => {
                      setFilterGameId(game.id);
                      setSearchParams({ tab: "feed" });
                    }}
                    className={cn(
                      "w-full flex items-center justify-between text-left p-1.5 rounded-lg border transition-all",
                      isSelected
                        ? "bg-acid/10 border-acid/35 text-acid"
                        : "border-transparent hover:bg-card-active hover:border-separator/50"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={game.capsuleUrl}
                        alt=""
                        className="h-8 w-11 object-cover rounded-md border border-separator/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold text-foreground truncate">
                          {game.name}
                        </p>
                        <p className="text-[9.5px] text-muted/60">
                          {getLivePlayers(game) > 0
                            ? `${getLivePlayers(game).toLocaleString()} playing`
                            : "Coming Soon"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-muted/40 select-none">
                      #{idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Widget 3: Who to Follow */}
          <Card className="p-4 border-separator/60 bg-card/65 backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-separator/40">
              <UserPlus className="h-4 w-4 text-cyan" />
              <h3 className="text-[12.5px] font-semibold text-foreground/90">
                Who to Follow
              </h3>
            </div>
            <div className="space-y-3">
              {followSuggestions.map((gamer) => {
                const isFollowing = following[gamer.handle];
                return (
                  <div key={gamer.handle} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={gamer.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover border border-separator/40 shrink-0 bg-card"
                      />
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold text-foreground truncate leading-none mb-0.5">
                          {gamer.name}
                        </p>
                        <p className="text-[9.5px] text-muted/65 truncate">
                          {gamer.handle}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleFollow(gamer.handle)}
                      className={cn(
                        "flex items-center justify-center p-1.5 rounded-lg border transition-all select-none shrink-0",
                        isFollowing
                          ? "border-green/20 bg-green/10 text-green hover:bg-green/15"
                          : "border-separator hover:bg-card-active text-muted hover:text-foreground"
                      )}
                      title={isFollowing ? "Unfollow" : "Follow"}
                    >
                      {isFollowing ? (
                        <UserCheck className="h-3.5 w-3.5" />
                      ) : (
                        <UserPlus className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Widget 4: Trending Topics */}
          <Card className="p-4 border-separator/60 bg-card/65 backdrop-blur-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-separator/40">
              <TrendingUp className="h-4 w-4 text-cyan" />
              <h3 className="text-[12.5px] font-semibold text-foreground/90">
                Trending Topics
              </h3>
            </div>
            <div className="space-y-2.5">
              {[
                { tag: "#GTA6", posts: "8.5k posts", keyword: "GTA 6" },
                { tag: "#MaleniaDefeated", posts: "1.2k posts", keyword: "Malenia" },
                { tag: "#Patch2_2", posts: "580 posts", keyword: "patch" },
                { tag: "#SteamDeck", posts: "4.3k posts", keyword: "steam" },
                { tag: "#WukongDLC", posts: "3.1k posts", keyword: "wukong" },
              ].map((topic) => (
                <button
                  key={topic.tag}
                  onClick={() => setSearchText(topic.tag)}
                  className="w-full text-left hover:bg-card-active/50 p-1.5 rounded-lg transition-all group block"
                >
                  <p className="text-[11.5px] font-semibold text-acid group-hover:underline">
                    {topic.tag}
                  </p>
                  <p className="text-[9.5px] text-muted/50">
                    {topic.posts}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </motion.div>
  );
}
