import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Globe, MessageCircle, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  useCommunities,
  useSocialGraphCounters,
  useUserCommunityIds,
} from "@/hooks/use-communities";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

export function CommunitiesTab() {
  const uid = useAuthStore((s) => s.profile?.uid);
  const { data: communities, isLoading } = useCommunities();
  const { data: myIds } = useUserCommunityIds(uid);
  const { data: counters } = useSocialGraphCounters(uid);

  const joinedSet = useMemo(() => new Set(myIds ?? []), [myIds]);

  if (isLoading) return <LoadingSpinner />;

  if (!communities || communities.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No communities yet"
        description="Communities will appear here once they're created."
      />
    );
  }

  return (
    <div className="space-y-4">
      {counters && (
        <Card className="grid grid-cols-3 divide-x divide-separator/60 overflow-hidden">
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted/55">Followers</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">
              {counters.followers.toLocaleString()}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted/55">Following</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">
              {counters.following.toLocaleString()}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted/55">Communities</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">
              {counters.communities.toLocaleString()}
            </p>
          </div>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {communities.map((c) => {
          const isMember = joinedSet.has(c.id);
          return (
            <Link key={c.id} to={ROUTES.community(c.slug)}>
              <Card className="group h-full overflow-hidden transition hover:bg-card-active">
                <div
                  className="h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url(${c.bannerUrl})` }}
                />
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-foreground">{c.name}</p>
                        {isMember && (
                          <span className="rounded-full bg-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-green">
                            Joined
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-[12px] text-muted/75">{c.description}</p>
                    </div>
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        c.visibility === "public"
                          ? "bg-positive/10 text-positive"
                          : "bg-orange/10 text-orange",
                      )}
                    >
                      <Globe className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-muted/70">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {c.memberCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {c.postCount.toLocaleString()}
                    </span>
                    {c.trendingScore > 0 && (
                      <span className="flex items-center gap-1 text-acid">
                        <Sparkles className="h-3 w-3" />
                        {c.trendingScore}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
