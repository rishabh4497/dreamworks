import { Headphones, HeadphoneOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useVoiceStore } from "@/stores/voice-store";
import { useVoiceChannels } from "@/hooks/use-voice";
import { cn } from "@/lib/utils";

export function VoiceWidget() {
  const activeChannelId = useVoiceStore((s) => s.activeChannelId);
  const session = useVoiceStore((s) => s.session);
  const muted = useVoiceStore((s) => s.muted);
  const deafened = useVoiceStore((s) => s.deafened);
  const leave = useVoiceStore((s) => s.leave);
  const toggleMute = useVoiceStore((s) => s.toggleMute);
  const toggleDeafen = useVoiceStore((s) => s.toggleDeafen);
  const { data: channels } = useVoiceChannels();

  if (!activeChannelId) return null;
  const channel = channels?.find((c) => c.id === activeChannelId);

  return (
    <Card className="pointer-events-auto fixed bottom-4 right-4 z-40 w-[280px] space-y-2.5 p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase tracking-widest text-green">Voice connected</p>
          <p className="text-[13px] font-semibold text-foreground">{channel?.name ?? "Channel"}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-red hover:bg-red/10 hover:text-red"
          onClick={() => void leave()}
          aria-label="Leave channel"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-32 space-y-1 overflow-y-auto">
        {(session?.participants ?? []).map((p) => (
          <div key={p.userId} className="flex items-center gap-2 text-[12px]">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                p.state === "speaking"
                  ? "bg-green"
                  : p.state === "muted" || p.state === "deafened"
                    ? "bg-orange"
                    : "bg-muted/40",
              )}
            />
            <span className="truncate text-foreground/85">{p.displayName}</span>
            {p.state === "deafened" && <HeadphoneOff className="h-3 w-3 text-orange" />}
            {p.state === "muted" && <MicOff className="h-3 w-3 text-orange" />}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-separator/60 pt-2">
        <Button
          size="sm"
          variant={muted ? "danger" : "secondary"}
          className="flex-1"
          onClick={() => void toggleMute()}
        >
          {muted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {muted ? "Muted" : "Mic"}
        </Button>
        <Button
          size="sm"
          variant={deafened ? "danger" : "secondary"}
          className="flex-1"
          onClick={() => void toggleDeafen()}
        >
          {deafened ? <HeadphoneOff className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
          {deafened ? "Deafened" : "Audio"}
        </Button>
      </div>
    </Card>
  );
}
