import { Loader2, Search, Twitch, Youtube } from "lucide-react";
import { useAIAction } from "@/hooks/use-ai";
import type { InfluencerDiscoveryPayload } from "@/lib/ai/payload-types";

interface Props {
  gameName?: string;
  genres?: string[];
  tags?: string[];
}

export function InfluencerDiscovery({
  gameName = "Sample Title",
  genres = ["Action", "Sci-Fi"],
  tags = ["FPS", "Co-op", "PvE"],
}: Props) {
  const mutation = useAIAction<"influencer-discovery", InfluencerDiscoveryPayload>(
    "influencer-discovery",
  );
  const creators = mutation.data?.creators ?? [
    {
      platform: "twitch" as const,
      handle: "FPS_God_99",
      audienceSize: 0,
      averageViewers: 12000,
      fitScore: 88,
      reason: "Averages 12k CCV — plays Action/Sci-Fi.",
    },
    {
      platform: "youtube" as const,
      handle: "CyberReviews",
      audienceSize: 2_400_000,
      fitScore: 81,
      reason: "Reviewed similar games.",
    },
  ];

  return (
    <div className="rounded-xl border border-separator bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold flex items-center gap-2">
          <Search className="h-5 w-5 text-pink-500" /> Influencer Discovery Engine
        </h3>
        <button
          onClick={() => mutation.mutate({ gameName, genres, tags })}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-separator bg-card-active px-3 py-1.5 text-[12px] font-medium hover:bg-card-hover disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mutation.isPending ? "Searching…" : mutation.data ? "Refresh" : "Run AI"}
        </button>
      </div>
      <p className="text-[13px] text-muted/80 mt-1 mb-4">
        AI searches Twitch and YouTube for creators who play similar games.
      </p>
      <div className="space-y-3">
        {creators.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-input p-3 rounded-lg border border-separator"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-white ${
                  c.platform === "twitch" ? "bg-[#6441a5]" : "bg-[#ff0000]"
                }`}
              >
                {c.platform === "twitch" ? (
                  <Twitch className="h-4 w-4" />
                ) : (
                  <Youtube className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-[12px] font-bold text-foreground">{c.handle}</p>
                <p className="text-[10px] text-muted">
                  {c.averageViewers
                    ? `Averages ${(c.averageViewers / 1000).toFixed(0)}k CCV`
                    : `${(c.audienceSize / 1_000_000).toFixed(1)}M subs`}{" "}
                  · Fit {c.fitScore}%
                </p>
                <p className="text-[10px] text-muted/70">{c.reason}</p>
              </div>
            </div>
            <button className="text-[11px] font-bold bg-pink-500 text-white px-3 py-1.5 rounded-md hover:bg-pink-600 transition-colors">
              Send Key
            </button>
          </div>
        ))}
      </div>
      {mutation.error && (
        <p className="mt-2 text-[11px] text-red">{mutation.error.message}</p>
      )}
    </div>
  );
}
