import { useMemo } from "react";
import { Mic, Radio, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useVoiceChannels } from "@/hooks/use-voice";
import { useVoiceStore } from "@/stores/voice-store";
import { cn } from "@/lib/utils";
import type { VoiceChannel, VoiceChannelKind } from "@/lib/types";

const KIND_LABELS: Record<VoiceChannelKind, string> = {
  party: "Party",
  guild: "Guild",
  community: "Community",
  game: "Game",
};

const KIND_STYLES: Record<VoiceChannelKind, string> = {
  party: "bg-positive/15 text-positive",
  guild: "bg-orange/15 text-orange",
  community: "bg-acid/15 text-acid",
  game: "bg-green/15 text-green",
};

function ChannelCard({ channel }: { channel: VoiceChannel }) {
  const activeChannelId = useVoiceStore((s) => s.activeChannelId);
  const join = useVoiceStore((s) => s.join);
  const leave = useVoiceStore((s) => s.leave);
  const isActive = activeChannelId === channel.id;

  return (
    <Card className="flex items-center justify-between gap-3 p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            KIND_STYLES[channel.kind],
          )}
        >
          <Radio className="h-4 w-4" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-foreground">{channel.name}</p>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                KIND_STYLES[channel.kind],
              )}
            >
              {KIND_LABELS[channel.kind]}
            </span>
          </div>
          <p className="text-[11px] text-muted/65">
            {channel.region} · capacity {channel.capacity}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isActive ? "danger" : "primary"}
        onClick={() => (isActive ? void leave() : void join(channel.id))}
      >
        <Mic className="h-3.5 w-3.5" />
        {isActive ? "Leave" : "Join"}
      </Button>
    </Card>
  );
}

export function VoiceTab() {
  const { data: channels, isLoading } = useVoiceChannels();

  const grouped = useMemo(() => {
    const map = new Map<VoiceChannelKind, VoiceChannel[]>();
    for (const channel of channels ?? []) {
      const list = map.get(channel.kind) ?? [];
      list.push(channel);
      map.set(channel.kind, list);
    }
    return map;
  }, [channels]);

  if (isLoading) return <LoadingSpinner />;

  if (!channels || channels.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No voice channels yet"
        description="Channels appear here once they're created."
      />
    );
  }

  const order: VoiceChannelKind[] = ["party", "guild", "community", "game"];

  return (
    <div className="space-y-5">
      <p className="text-[12px] text-muted/75">
        Real-time voice channels backed by cloud signaling. Audio media is mock — presence and
        mute/deafen state sync live via Firestore.
      </p>
      {order.map((kind) => {
        const list = grouped.get(kind);
        if (!list || list.length === 0) return null;
        return (
          <section key={kind} className="space-y-2.5">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted/55">
              {KIND_LABELS[kind]} channels
            </h2>
            <div className="grid gap-2.5">
              {list.map((channel) => (
                <ChannelCard key={channel.id} channel={channel} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
