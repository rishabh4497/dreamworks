import { useQuery } from "@tanstack/react-query";
import { listVoiceChannels } from "@/lib/api/voice";
import type { VoiceChannelKind } from "@/lib/types";

export const voiceKeys = {
  channels: (kind?: VoiceChannelKind) => ["voice", "channels", kind ?? "all"] as const,
};

export function useVoiceChannels(kind?: VoiceChannelKind) {
  return useQuery({
    queryKey: voiceKeys.channels(kind),
    queryFn: () => listVoiceChannels(kind),
  });
}
