import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { BarChart3, Cloud, Crown, Download, Gamepad2, Globe, Image as ImageIcon, MessageSquare, MonitorPlay, Pencil, Send, ShoppingCart, Sparkles, Tag } from "lucide-react";
import { useGameDetail } from "@/hooks/use-games";
import { usePriceHistory, useHistoricalLows } from "@/hooks/use-game-db";
import { useGameReviews } from "@/hooks/use-reviews";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { PriceTag } from "@/components/ui/price-tag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingBar } from "@/components/ui/rating-bar";
import { WishlistButton } from "@/components/store/WishlistButton";
import { AddToLibraryButton } from "@/components/store/AddToLibraryButton";
import { DemoButton } from "@/components/store/DemoButton";
import { PreOrderPanel } from "@/components/store/PreOrderPanel";
import { FriendsWhoOwn } from "@/components/store/FriendsWhoOwn";
import { AIGameOverview } from "@/components/store/AIGameOverview";
import { AIStudioOverview } from "@/components/store/AIStudioOverview";
import { ImageLightbox } from "@/components/store/ImageLightbox";
import { ReviewComposer } from "@/components/store/ReviewComposer";
import { PlaytimeBadge } from "@/components/store/PlaytimeBadge";
import { CompatibilityPanel } from "@/components/store/CompatibilityPanel";
import { SystemCompatibility } from "@/components/store/SystemCompatibility";
import { FacetRadar } from "@/components/store/FacetRadar";
import { FacetBars } from "@/components/store/FacetBars";
import { LfgMatchmaking } from "@/components/store/LfgMatchmaking";
import { DealForecaster } from "@/components/store/DealForecaster";
import { PriceHistoryChart } from "@/components/db/PriceHistoryChart";
import { HistoricalLowsTable } from "@/components/db/HistoricalLowsTable";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useLibraryStore } from "@/stores/library-store";
import { useCartStore } from "@/stores/cart-store";
import { useUserReviewsStore } from "@/stores/user-reviews-store";
import { useAccentStore } from "@/stores/accent-store";
import { useAuthStore } from "@/stores/auth-store";
import { useStartDownload } from "@/hooks/use-start-download";
import { toast } from "@/stores/toast-store";
import { GameLiveOpsSection } from "@/components/store/GameLiveOpsSection";
import { GameMaintenanceBanner } from "@/components/store/GameMaintenanceBanner";
import { ROUTES } from "@/lib/routes";
import { gameAccent } from "@/lib/game-accents";
import { studioBrand } from "@/lib/studio-logos";
import type { FacetAverages, Review, GameDetail } from "@/lib/types";
import { cn, compactNumber, formatBytes, formatDate, formatHours, slugify } from "@/lib/utils";

function computeFacetAverages(reviews: Review[]): FacetAverages {
  const rated = reviews.filter((r) => r.facets);
  const ratedCount = rated.length;
  if (ratedCount === 0) {
    return { gameplay: 0, story: 0, polish: 0, value: 0, accessibility: 0, ratedCount: 0 };
  }
  const sums = rated.reduce(
    (acc, r) => {
      const f = r.facets!;
      acc.gameplay += f.gameplay;
      acc.story += f.story;
      acc.polish += f.polish;
      acc.value += f.value;
      acc.accessibility += f.accessibility;
      return acc;
    },
    { gameplay: 0, story: 0, polish: 0, value: 0, accessibility: 0 },
  );
  return {
    gameplay: sums.gameplay / ratedCount,
    story: sums.story / ratedCount,
    polish: sums.polish / ratedCount,
    value: sums.value / ratedCount,
    accessibility: sums.accessibility / ratedCount,
    ratedCount,
  };
}

export function GameDetailPage() {
  const { gameId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const previewData = location.state?.previewData as GameDetail | undefined;
  
  const { data: fetchedDetail, isLoading: isFetching } = useGameDetail(previewData ? undefined : gameId);
  const detail = previewData || fetchedDetail;
  const isLoading = !previewData && isFetching;

  const { data: priceHistory } = usePriceHistory(previewData ? undefined : gameId);
  const { data: lows } = useHistoricalLows(previewData ? undefined : gameId);
  const reviews = useGameReviews(previewData ? undefined : gameId);
  const pushRecent = useRecentlyViewedStore((s) => s.push);
  const owns = useLibraryStore((s) => s.has(gameId));
  const userReview = useUserReviewsStore((s) => s.byGame[gameId]);
  const isSubscribed = useAuthStore((s) => s.profile?.isSubscribed);
  const [activeShot, setActiveShot] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const [askAIOpen, setAskAIOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const facetAverages = useMemo(
    () => computeFacetAverages(reviews.data ?? []),
    [reviews.data],
  );

  useEffect(() => {
    if (gameId) pushRecent(gameId);
  }, [gameId, pushRecent]);

  const setAccent = useAccentStore((s) => s.setAccent);
  // Prefer the game's own key-art accent; fall back to publisher's brand
  // color if we don't have a hand-curated palette for this title yet.
  const accentHex = detail
    ? gameAccent(detail.id) ??
      studioBrand(detail.publisher)?.brandColor ??
      studioBrand(detail.developer)?.brandColor ??
      null
    : null;
  useEffect(() => {
    setAccent(accentHex);
    return () => setAccent(null);
  }, [accentHex, setAccent]);

  if (isLoading) return <LoadingSpinner label="Loading game…" />;
  if (!detail) {
    return (
      <div className="py-12 text-center text-muted">
        Game not found.{" "}
        <Link to={ROUTES.store} className="text-acid underline">
          Back to store
        </Link>
      </div>
    );
  }

  const heroImage = detail.screenshots[activeShot]?.url ?? detail.headerUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <div className="min-w-0">
        <GameMaintenanceBanner appId={detail.id} />
        {/* Hero / screenshots */}
        <div
          className="overflow-hidden rounded-2xl border border-separator bg-card mb-4 cursor-zoom-in"
          onDoubleClick={() => setLightboxUrl(heroImage)}
          title="Double-click to enlarge"
        >
          <img
            src={heroImage}
            alt={detail.name}
            className="aspect-[16/9] w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto shelf-scroll">
          {detail.screenshots.map((s, i) => (
            <button
              key={s.url}
              onClick={() => setActiveShot(i)}
              onDoubleClick={() => setLightboxUrl(s.url)}
              className={`h-16 w-28 shrink-0 overflow-hidden rounded-md border cursor-zoom-in ${
                i === activeShot ? "border-acid" : "border-separator opacity-70 hover:opacity-100"
              }`}
              title="Double-click to enlarge"
            >
              <img src={s.thumbUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </button>
          ))}
        </div>

        <div className="mb-2 flex items-center gap-2">
          {detail.comingSoon && <Badge variant="soon">Coming Soon</Badge>}
          {detail.price.isFree && <Badge variant="free">Free to Play</Badge>}
          {detail.isOnSale && !detail.price.isFree && (
            <Badge variant="discount">-{detail.price.discountPct}%</Badge>
          )}
        </div>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground">{detail.name}</h1>
        <p className="mt-1 text-[13px] text-muted/70">
          By{" "}
          <Link
            to={ROUTES.developer(slugify(detail.developer))}
            className="font-medium text-acid underline decoration-acid/30 underline-offset-2 transition-colors hover:decoration-acid"
          >
            {detail.developer}
          </Link>{" "}
          · Published by{" "}
          <Link
            to={ROUTES.publisher(slugify(detail.publisher))}
            className="font-medium text-acid underline decoration-acid/30 underline-offset-2 transition-colors hover:decoration-acid"
          >
            {detail.publisher}
          </Link>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <RatingBar summary={detail.reviewSummary} />
          {detail.metaScore !== null && (
            <span className="rounded-md bg-card-active px-1.5 py-[2px] text-[11px] font-semibold text-foreground/80">
              Meta {detail.metaScore}
            </span>
          )}
          <span className="text-[11px] text-muted/50">{formatDate(detail.releaseDate)}</span>
        </div>

        <p className="mt-6 text-[14px] leading-relaxed text-foreground/85 whitespace-pre-line">
          {detail.shortDescription}
        </p>

        <GameLiveOpsSection appId={detail.id} />

        <div className="mt-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
            Popular user-defined tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detail.tags.map((t) => (
              <Link
                key={t}
                to={ROUTES.storeTag(t)}
                className="inline-flex items-center gap-1 rounded-md border border-separator bg-card-active px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:border-acid/40 hover:bg-acid/15 hover:text-acid"
              >
                <Tag className="h-3 w-3 opacity-60" />
                {t}
              </Link>
            ))}
          </div>
        </div>

        {/* Price history (SteamDB inline) */}
        <section className="mt-10">
          <header className="mb-3 flex items-baseline justify-between">
            <div>
              <h2 className="text-[16px] font-semibold text-foreground">Price history</h2>
              <p className="text-[12px] text-muted/60">Last 365 days · USD</p>
            </div>
            <button
              onClick={() => navigate(ROUTES.gameDb(detail.id))}
              className="inline-flex items-center gap-1 text-[12px] text-muted/70 hover:text-foreground/80"
            >
              <BarChart3 className="h-3.5 w-3.5" /> View on Dreamworks DB
            </button>
          </header>
          <div className="mb-4">
            <DealForecaster gameId={detail.id} />
          </div>
          {priceHistory && <PriceHistoryChart data={priceHistory} />}
          {lows && (
            <div className="mt-4">
              <HistoricalLowsTable lows={lows} />
            </div>
          )}
        </section>

        <AIGameOverview gameDetail={detail} />

        <div className="mt-6 space-y-4">
          {detail.developer && (
            <AIStudioOverview kind="Developer" name={detail.developer} variant="compact" />
          )}
          {detail.publisher && detail.publisher !== detail.developer && (
            <AIStudioOverview kind="Publisher" name={detail.publisher} variant="compact" />
          )}
        </div>

        {/* About */}
        <section className="mt-10">
          <h2 className="text-[16px] font-semibold text-foreground mb-3">About this game</h2>
          <p className="text-[13px] leading-relaxed text-foreground/80 whitespace-pre-line">
            {detail.longDescription}
          </p>
        </section>

        {/* System requirements */}
        <section className="mt-10">
          <h2 className="text-[16px] font-semibold text-foreground mb-3">System requirements</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(detail.systemRequirements).map(([key, block]) =>
              block ? (
                <div key={key} className="rounded-xl border border-separator bg-card p-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-widest text-muted/60">
                    {key}
                  </p>
                  <ul className="space-y-1 text-[12px] text-foreground/80">
                    <li><span className="text-muted/60">OS:</span> {block.os}</li>
                    <li><span className="text-muted/60">CPU:</span> {block.cpu}</li>
                    <li><span className="text-muted/60">Memory:</span> {block.memory}</li>
                    <li><span className="text-muted/60">GPU:</span> {block.gpu}</li>
                    <li><span className="text-muted/60">Storage:</span> {block.storage}</li>
                  </ul>
                </div>
              ) : null,
            )}
          </div>
          <SystemCompatibility game={detail} />
        </section>

        {/* Review breakdown (facet radar) */}
        {facetAverages.ratedCount > 0 && (
          <section className="mt-10">
            <h2 className="text-[16px] font-semibold text-foreground mb-3">Review breakdown</h2>
            <div className="rounded-2xl border border-separator bg-card p-4">
              <FacetRadar averages={facetAverages} />
              <p className="mt-2 text-center text-[11px] text-muted/60">
                Based on {compactNumber(facetAverages.ratedCount)} rated review
                {facetAverages.ratedCount === 1 ? "" : "s"}
              </p>
            </div>
          </section>
        )}

        {/* Reviews preview */}
        <section className="mt-10">
          <header className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[16px] font-semibold text-foreground">Recent reviews</h2>
            {owns && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setComposerOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                {userReview ? "Edit your review" : "Write a review"}
              </Button>
            )}
          </header>
          {!owns && !userReview && (
            <p className="mb-3 rounded-lg border border-separator bg-card-active/40 px-3 py-2 text-[11.5px] text-muted/70">
              Own this game to write your own review.
            </p>
          )}
          <div className="space-y-3">
            {userReview && (
              <ReviewCard review={userReview} isYours />
            )}
            {(reviews.data ?? [])
              .filter((r) => r.id !== userReview?.id)
              .slice(0, 4)
              .map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
          </div>
        </section>
      </div>

      {/* Right rail */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-separator bg-card overflow-hidden">
          <img src={detail.headerUrl} alt="" className="aspect-[460/215] w-full object-cover" referrerPolicy="no-referrer" />
          <div className="p-4 space-y-3">
            {owns && (
              <Link
                to={ROUTES.libraryGame(detail.id)}
                className="flex items-center justify-between rounded-lg border border-acid/30 bg-acid/10 px-3 py-2 text-[12px] font-medium text-acid hover:bg-acid/15 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Gamepad2 className="h-3.5 w-3.5" /> Open in your library
                </span>
                <span aria-hidden>→</span>
              </Link>
            )}
            <PriceTag price={detail.price} size="lg" />
            {detail.includedInSubscription && (
              <div className="rounded-lg border border-[#a052ff]/30 bg-[#a052ff]/10 px-3 py-2 text-center text-[12px] font-semibold text-[#c99eff]">
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="h-3 w-3" /> Included with Dreamworks+
                </span>
              </div>
            )}
            <PlusAwareActions detail={detail} isSubscribed={!!isSubscribed} owns={owns} navigate={navigate} />
            {detail.hasDemo && (
              <div className="flex flex-wrap gap-2">
                <DemoButton />
              </div>
            )}

            <dl className="grid grid-cols-3 gap-2 pt-2 text-center">
              <div className="rounded-lg bg-card-active py-2">
                <dt className="text-[10px] text-muted/60">Players now</dt>
                <dd className="text-[13px] font-semibold text-foreground">
                  {compactNumber(detail.currentPlayers)}
                </dd>
              </div>
              <div className="rounded-lg bg-card-active py-2">
                <dt className="text-[10px] text-muted/60">Peak 24h</dt>
                <dd className="text-[13px] font-semibold text-foreground">
                  {compactNumber(detail.peakPlayers24h)}
                </dd>
              </div>
              <div className="rounded-lg bg-card-active py-2">
                <dt className="text-[10px] text-muted/60">All-time</dt>
                <dd className="text-[13px] font-semibold text-foreground">
                  {compactNumber(detail.peakPlayersAllTime)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {detail.comingSoon && detail.preOrderTiers && detail.preOrderTiers.length > 0 && (
          <PreOrderPanel game={detail} />
        )}

        <PlaytimeBadge playtime={detail.playtime} />

        <CompatibilityPanel gameId={detail.id} />

        <div className="rounded-2xl border border-separator bg-card p-4 space-y-3 text-[12px]">
          <Row icon={Tag} label="Genres" value={detail.genres.join(", ")} />
          <Row icon={MonitorPlay} label="Platforms" value={detail.platforms.join(" · ")} />
          <Row icon={Globe} label="Languages" value={`${detail.languages.length} supported`} />
          <Row icon={ImageIcon} label="Achievements" value={detail.achievementCount.toString()} />
          <Row label="Size" value={formatBytes(detail.estimatedSizeBytes)} />
          <Row label="DRM" value={detail.drm.join(", ")} />
          {detail.ageRating && (
            <Row label={detail.ageRating.board} value={detail.ageRating.rating} />
          )}
        </div>

        <button
          onClick={() => navigate(ROUTES.gameDb(detail.id))}
          className="w-full rounded-xl border border-separator bg-card px-4 py-3 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground/80 transition-all"
        >
          View deeper analytics on Dreamworks DB →
        </button>

        <button
          onClick={() => setAskAIOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-acid/30 bg-acid/10 px-4 py-3 text-[12px] font-semibold text-acid hover:bg-acid/15 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI about this game
        </button>

        <button
          onClick={() => navigate(ROUTES.forumGame(detail.id))}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-separator bg-card px-4 py-3 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground/80 transition-all"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Discussions
        </button>

        <FriendsWhoOwn gameId={detail.id} />
        <LfgMatchmaking gameId={detail.id} />
      </aside>
      </div>

      <ReviewComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        gameId={detail.id}
        gameName={detail.name}
      />
      <ImageLightbox url={lightboxUrl} alt={detail.name} onClose={() => setLightboxUrl(null)} />
      <AskAIModal
        open={askAIOpen}
        onClose={() => setAskAIOpen(false)}
        gameName={detail.name}
      />
    </motion.div>
  );
}

// ── Ask AI modal ─────────────────────────────────────────────────────────
// Lightweight chat-style UI. Answers are mock-generated for v1; the seam is
// here for a future Claude API call (just swap `getMockAnswer` for an SSE
// stream).
import { Modal } from "@/components/ui/modal";

interface ChatMsg {
  role: "user" | "ai";
  text: string;
}

const SUGGESTED_QUESTIONS = [
  "Is this beginner-friendly?",
  "How long does the main story take?",
  "Should I play with mouse or controller?",
  "What's the best build for first-timers?",
];

function getMockAnswer(question: string, gameName: string): string {
  const q = question.toLowerCase();
  if (q.includes("beginner") || q.includes("hard") || q.includes("difficult")) {
    return `${gameName} has a learning curve, but offers difficulty settings and an active community for help. Most players say the first 2-3 hours feel daunting, then it clicks.`;
  }
  if (q.includes("long") || q.includes("hours") || q.includes("complete")) {
    return `Main story typically runs 25-40 hours. Completionists can clock 80+. Side content is generous but optional.`;
  }
  if (q.includes("controller") || q.includes("mouse") || q.includes("keyboard")) {
    return `${gameName} supports both. Controller is the popular pick for combat feel; mouse + keyboard wins on menu-heavy moments.`;
  }
  if (q.includes("build") || q.includes("class") || q.includes("character")) {
    return `For your first run, lean balanced: invest in your primary stat early, pick a forgiving weapon, and don't worry about respec — it's available.`;
  }
  if (q.includes("dlc") || q.includes("expansion")) {
    return `The base game is the recommended starting point. DLC is excellent but assumes familiarity with mechanics.`;
  }
  return `Based on community discussions and reviews, here's the short version for ${gameName}: the strengths are atmosphere and progression depth; weaknesses are pacing in the middle act. Worth your time if you enjoy the genre.`;
}

function AskAIModal({
  open,
  onClose,
  gameName,
}: {
  open: boolean;
  onClose: () => void;
  gameName: string;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessages([]);
      setInput("");
      setThinking(false);
    }
  }, [open]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    // Simulate model latency.
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: getMockAnswer(q, gameName) }]);
      setThinking(false);
    }, 650);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-acid" />
          <h2 className="text-[16px] font-semibold text-foreground">
            Ask AI about {gameName}
          </h2>
          <span className="ml-auto rounded-full border border-acid/30 bg-acid/10 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-acid">
            Beta
          </span>
        </div>
        <p className="text-[11.5px] text-muted/60">
          Answers blend community discussions, reviews, and patch notes. Not a replacement for the developer's official docs.
        </p>

        <div className="max-h-[420px] min-h-[200px] space-y-3 overflow-y-auto rounded-xl border border-separator bg-card-active/30 p-4">
          {messages.length === 0 ? (
            <div className="space-y-2">
              <p className="text-[12px] text-muted/70">Try one of these:</p>
              {SUGGESTED_QUESTIONS.map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => send(sq)}
                  className="block w-full rounded-lg border border-separator bg-card px-3 py-2 text-left text-[12.5px] text-foreground/80 transition-colors hover:border-acid/30 hover:bg-acid/10 hover:text-acid"
                >
                  {sq}
                </button>
              ))}
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                      m.role === "user"
                        ? "bg-acid text-background"
                        : "bg-card border border-separator text-foreground/85",
                    )}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-separator bg-card px-3.5 py-2.5 text-[12px] italic text-muted/60">
                    Thinking…
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask anything about ${gameName}…`}
            className="flex-1 rounded-xl border border-separator bg-input px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="inline-flex items-center gap-1.5 rounded-xl bg-acid px-4 py-2 text-[12px] font-semibold text-background disabled:opacity-40 hover:brightness-110 transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            Ask
          </button>
        </form>
      </div>
    </Modal>
  );
}

function ReviewCard({ review: r, isYours }: { review: Review; isYours?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        isYours ? "border-acid/40 bg-acid/[0.03]" : "border-separator",
      )}
    >
      {isYours && (
        <p className="mb-2 inline-flex items-center gap-1 rounded-full border border-acid/30 bg-acid/10 px-2 py-[1px] text-[9px] font-bold uppercase tracking-widest text-acid">
          Your review
        </p>
      )}
      <div className="mb-2 flex items-center gap-2">
        <img src={r.authorAvatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-[12px] font-medium text-foreground/80">{r.authorName}</p>
          <p className="text-[10px] text-muted/50">
            {formatHours(r.authorHoursOnRecord * 60)} on record · {formatDate(r.postedAt)}
          </p>
        </div>
        <span
          className={cn(
            "text-[11px] font-semibold",
            r.recommended ? "text-positive" : "text-red",
          )}
        >
          {r.recommended ? "Recommended" : "Not recommended"}
        </span>
      </div>
      <p className="text-[13px] text-foreground/85">{r.body}</p>
      {r.facets && <FacetBars facets={r.facets} />}
      <p className="mt-2 text-[10px] text-muted/40">
        {compactNumber(r.helpfulCount)} found this helpful · {compactNumber(r.funnyCount)} funny
      </p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? (
        <Icon className="h-3.5 w-3.5 text-muted/50" />
      ) : (
        <span className="h-3.5 w-3.5 inline-block" />
      )}
      <span className="text-muted/60">{label}</span>
      <span className="ml-auto text-foreground/80 truncate">{value}</span>
    </div>
  );
}

interface PlusAwareActionsProps {
  detail: GameDetail;
  isSubscribed: boolean;
  owns: boolean;
  navigate: (to: string) => void;
}

/**
 * Game-detail action stack that splits Plus benefits from purchase.
 *
 * - Subscribed + game-in-Plus → Play with Plus, Play in Cloud (if eligible),
 *   Install (free with Plus), and Add to Cart for permanent ownership, all
 *   visible at once.
 * - Non-subscriber + game-in-Plus → a Plus pitch card next to the standard
 *   cart flow.
 * - Otherwise → the standard cart/library button.
 */
function PlusAwareActions({ detail, isSubscribed, owns, navigate }: PlusAwareActionsProps) {
  const cartHas = useCartStore((s) => s.has(detail.id));
  const addToCart = useCartStore((s) => s.add);
  const addFromPurchase = useLibraryStore((s) => s.addFromPurchase);
  const startDownload = useStartDownload();

  const included = !!detail.includedInSubscription;
  const cloudPlayable = !!detail.cloudPlayable;

  // Subscribed user, game is in Plus, doesn't own it yet.
  if (included && isSubscribed && !owns) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => toast.success(`Launching “${detail.name}” via Dreamworks+`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
          style={{ background: "#a052ff", boxShadow: "0 8px 24px rgba(160, 82, 255, 0.45)" }}
        >
          <Crown className="h-4 w-4" />
          Play with Dreamworks+
        </button>

        {cloudPlayable && (
          <button
            type="button"
            onClick={() => toast.success(`Streaming “${detail.name}” to this device`)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan/40 bg-cyan/10 px-4 py-2.5 text-[13px] font-semibold text-cyan transition-all hover:bg-cyan/15"
          >
            <Cloud className="h-4 w-4" />
            Play in Cloud
          </button>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            onClick={async () => {
              await addFromPurchase([detail.id], `plus-${detail.id}`);
              startDownload(detail.id, detail.estimatedSizeBytes || 8_000_000_000, { silent: true });
              toast.success(`Adding “${detail.name}” to your library`);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-separator bg-card-active px-4 py-2.5 text-[13px] font-semibold text-foreground/85 transition-all hover:bg-card-hover"
          >
            <Download className="h-4 w-4" />
            Add to library
          </button>
          <WishlistButton gameId={detail.id} />
        </div>

        {!detail.price.isFree && (
          <button
            type="button"
            onClick={() => {
              if (cartHas) {
                navigate(ROUTES.cart);
                return;
              }
              addToCart(detail.id);
              toast.success(`Added “${detail.name}” to cart`);
            }}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-[12px] font-medium transition-all",
              cartHas
                ? "border border-acid/40 bg-acid/10 text-acid hover:bg-acid/15"
                : "text-muted/80 hover:text-foreground",
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {cartHas ? "In cart — view" : "Or own it permanently"}
          </button>
        )}

        <p className="pt-1 text-center text-[10.5px] text-muted/55">
          Free with Plus while you're a member. Buy to keep it forever.
        </p>
      </div>
    );
  }

  // Game is in Plus but user isn't subscribed — surface the upsell next to the standard cart flow.
  if (included && !isSubscribed && !owns) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => navigate(ROUTES.plus)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:brightness-110"
          style={{ background: "#a052ff", boxShadow: "0 8px 24px rgba(160, 82, 255, 0.45)" }}
        >
          <Crown className="h-4 w-4" />
          {cloudPlayable ? "Stream free with Plus" : "Get it free with Plus"}
        </button>
        <div className="flex gap-2">
          <AddToLibraryButton game={detail} />
          <WishlistButton gameId={detail.id} />
        </div>
        <p className="pt-1 text-center text-[10.5px] text-muted/55">
          {cloudPlayable
            ? "Plus members stream this title in 4K. Try a month free."
            : "Plus members play this title free."}
        </p>
      </div>
    );
  }

  // Default / owned path — existing behavior.
  return (
    <div className="flex gap-2">
      <AddToLibraryButton game={detail} />
      <WishlistButton gameId={detail.id} />
    </div>
  );
}
