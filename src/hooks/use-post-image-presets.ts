import { useQuery } from "@tanstack/react-query";
import { listPostImagePresets } from "@/lib/api/feed";

export const postImagePresetKeys = {
  all: ["post-image-presets"] as const,
};

export function usePostImagePresets() {
  return useQuery({
    queryKey: postImagePresetKeys.all,
    queryFn: listPostImagePresets,
  });
}
