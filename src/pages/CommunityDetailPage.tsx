import { useState } from "react";
import { useParams } from "react-router-dom";
import { Heart, MessageCircle, Send, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { QueryErrorState } from "@/components/common/QueryErrorState";
import {
  useCommunityBySlug,
  useCommunityPosts,
  useCreateCommunityPost,
  useJoinCommunity,
  useLeaveCommunity,
  useUserCommunityIds,
} from "@/hooks/use-communities";
import { useAuthStore } from "@/stores/auth-store";
import { relativeDate } from "@/lib/utils";

export function CommunityDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const uid = useAuthStore((s) => s.profile?.uid);
  const profile = useAuthStore((s) => s.profile);
  const { data: community, isLoading, error, refetch } = useCommunityBySlug(slug);
  const { data: posts } = useCommunityPosts(community?.id);
  const { data: myIds } = useUserCommunityIds(uid);
  const join = useJoinCommunity(uid);
  const leave = useLeaveCommunity(uid);
  const createPost = useCreateCommunityPost();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  if (isLoading) return <LoadingSpinner />;
  if (error) return <QueryErrorState onRetry={() => void refetch()} />;
  if (!community) {
    return (
      <EmptyState
        icon={Users}
        title="Community not found"
        description="This community may have been removed."
      />
    );
  }

  const isMember = (myIds ?? []).includes(community.id);

  const onSubmit = () => {
    if (!profile?.uid || !title.trim() || !body.trim()) return;
    createPost.mutate(
      {
        communityId: community.id,
        authorId: profile.uid,
        authorName: profile.displayName ?? "Player",
        authorAvatarUrl: profile.avatarUrl ?? "",
        title: title.trim(),
        body: body.trim(),
      },
      {
        onSuccess: () => {
          setTitle("");
          setBody("");
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div
        className="relative h-44 overflow-hidden rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${community.bannerUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-[24px] font-semibold text-foreground">{community.name}</h1>
            <div className="flex items-center gap-3 text-[12px] text-muted/85">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {community.memberCount.toLocaleString()} members
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {community.postCount.toLocaleString()} posts
              </span>
            </div>
          </div>
          <Button
            variant={isMember ? "secondary" : "primary"}
            disabled={!uid || join.isPending || leave.isPending}
            onClick={() =>
              isMember ? leave.mutate(community.id) : join.mutate(community.id)
            }
          >
            {isMember ? "Leave" : "Join"}
          </Button>
        </div>
      </div>

      <p className="text-[13px] text-muted/85">{community.description}</p>

      {isMember && (
        <Card className="space-y-2.5 p-4">
          <Input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="min-h-24 w-full rounded-lg border border-separator bg-input px-3 py-2 text-[13px] text-foreground placeholder:text-muted/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-acid/30"
            placeholder="Share something with the community…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!title.trim() || !body.trim() || createPost.isPending}
              onClick={onSubmit}
            >
              <Send className="h-3.5 w-3.5" />
              Post
            </Button>
          </div>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
          Recent posts
        </h2>
        {!posts || posts.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No posts yet"
            description={isMember ? "Be the first to post." : "Join the community to start posting."}
          />
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id} className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.authorAvatarUrl}
                      alt={post.authorName}
                      className="h-7 w-7 rounded-full"
                      loading="lazy"
                    />
                    <div>
                      <p className="text-[12px] font-semibold text-foreground/85">
                        {post.authorName}
                      </p>
                      <p className="text-[10px] text-muted/60">{relativeDate(post.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <h3 className="text-[14px] font-semibold text-foreground">{post.title}</h3>
                <p className="whitespace-pre-wrap text-[13px] text-muted/85">{post.body}</p>
                <div className="flex items-center gap-4 pt-1 text-[11px] text-muted/65">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.commentCount}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
