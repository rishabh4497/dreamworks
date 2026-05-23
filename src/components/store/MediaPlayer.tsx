import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { Screenshot, Trailer } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MediaItem =
  | { kind: "video"; trailer: Trailer }
  | { kind: "image"; screenshot: Screenshot };

interface MediaPlayerProps {
  item: MediaItem | undefined;
  /** Fallback image used when a trailer has no poster. */
  fallbackImage: string;
  /** Alt for images / aria-label for the play button. */
  altText: string;
  /** Optional double-click handler for images (used by the lightbox). */
  onImageDoubleClick?: () => void;
}

function trailerPoster(t: Trailer, fallback: string): string {
  if (t.provider === "youtube" && t.id) {
    return `https://img.youtube.com/vi/${t.id}/maxresdefault.jpg`;
  }
  return t.posterUrl || fallback;
}

/**
 * Build a list of <source> candidates for a self-hosted trailer URL. Steam
 * serves trailers as `movie480_vp9.webm` by default, which WKWebView (Tauri on
 * macOS) and some other engines can't decode reliably. We list the VP9 webm
 * first, then a legacy webm, then an mp4 — the browser picks the first format
 * it can actually play.
 */
function videoSources(url: string): { src: string; type?: string }[] {
  const vp9Match = url.match(/^(.*)_vp9\.webm(\?.*)?$/);
  if (vp9Match) {
    const base = vp9Match[1];
    const query = vp9Match[2] ?? "";
    return [
      { src: url, type: 'video/webm; codecs="vp9,opus"' },
      { src: `${base}.webm${query}`, type: "video/webm" },
      { src: `${base}.mp4${query}`, type: "video/mp4" },
    ];
  }
  return [{ src: url }];
}

/**
 * Hero media slot that:
 *   1. Renders only the poster image on initial paint — zero network requests
 *      for video bytes or the YouTube player iframe.
 *   2. Mounts the <iframe> or <video> only after the user clicks Play.
 *   3. When the user switches to a different trailer via thumbnails, auto-plays
 *      the new one (they're clearly engaged).
 *
 * This is the single biggest perf win on the game detail page: a YouTube embed
 * with autoplay pulls ~600KB of player JS + the video stream on every page
 * visit, even if the user is just looking at screenshots.
 */
export function MediaPlayer({
  item,
  fallbackImage,
  altText,
  onImageDoubleClick,
}: MediaPlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  // Use a ref to remember the last item identity so we can decide when to keep
  // hasPlayed sticky vs reset it.
  const lastKey = useRef<string | null>(null);

  // When the active media changes:
  //   - switching from one video to another → keep playing (user is engaged).
  //   - switching from image → next interaction → reset to poster on the new video.
  // Simpler heuristic: if the previous active was a video AND the new is a
  // video, stay played. Otherwise reset to poster.
  const currentKey = item
    ? item.kind === "video"
      ? `v:${item.trailer.url}`
      : `i:${item.screenshot.url}`
    : null;

  useEffect(() => {
    const prev = lastKey.current;
    lastKey.current = currentKey;
    if (!item) {
      setHasPlayed(false);
      return;
    }
    if (item.kind === "image") {
      setHasPlayed(false);
      return;
    }
    // Video. If we were already playing a video, keep playing.
    if (prev && prev.startsWith("v:")) {
      setHasPlayed(true);
      return;
    }
    // New entry into a video from image / nothing — wait for user click.
    setHasPlayed(false);
  }, [currentKey, item]);

  if (!item) {
    return (
      <img
        src={fallbackImage}
        alt={altText}
        className="aspect-[16/9] w-full object-cover"
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  if (item.kind === "image") {
    return (
      <img
        src={item.screenshot.url}
        alt={altText}
        onDoubleClick={onImageDoubleClick}
        className="aspect-[16/9] w-full object-cover"
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  const trailer = item.trailer;
  const poster = trailerPoster(trailer, fallbackImage);

  // Poster + Play button. No iframe / no <video> until the user clicks.
  if (!hasPlayed) {
    return (
      <button
        type="button"
        onClick={() => setHasPlayed(true)}
        className="group relative block aspect-[16/9] w-full overflow-hidden bg-black"
        aria-label={`Play ${altText} trailer`}
      >
        <img
          src={poster}
          alt=""
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== fallbackImage) img.src = fallbackImage;
          }}
        />
        <span className="absolute inset-0 bg-black/15 transition-colors group-hover:bg-black/10" />
        <span
          className={cn(
            "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
            "bg-background/85 text-foreground shadow-2xl backdrop-blur transition-all",
            "group-hover:scale-110 group-hover:bg-acid group-hover:text-background",
          )}
        >
          <Play className="h-6 w-6 fill-current" />
        </span>
      </button>
    );
  }

  // User has clicked Play (or switched between trailers) — mount the player.
  if (trailer.provider === "youtube" && trailer.id) {
    return (
      <iframe
        key={trailer.id}
        src={`https://www.youtube-nocookie.com/embed/${trailer.id}?autoplay=1&mute=1&rel=0&playsinline=1`}
        title={`${altText} trailer`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-[16/9] w-full"
      />
    );
  }

  return (
    <video
      key={trailer.url}
      poster={poster}
      controls
      autoPlay
      muted
      playsInline
      preload="metadata"
      className="aspect-[16/9] w-full bg-black object-contain"
    >
      {videoSources(trailer.url).map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
