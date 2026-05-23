import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDeveloper,
  getMyPrimaryDeveloper,
  saveDeveloper,
  type DeveloperInput,
} from "@/lib/api/developers";

export const developerKeys = {
  all: ["developers"] as const,
  byId: (slug: string) => [...developerKeys.all, "id", slug] as const,
  mine: () => [...developerKeys.all, "mine"] as const,
};

export function useDeveloper(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? developerKeys.byId(slug) : ["disabled"],
    queryFn: () => getDeveloper(slug!),
    enabled: !!slug,
  });
}

export function useMyDeveloper() {
  return useQuery({ queryKey: developerKeys.mine(), queryFn: getMyPrimaryDeveloper });
}

export function useSaveDeveloper() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DeveloperInput) => saveDeveloper(input),
    onSuccess: (dev) => {
      qc.invalidateQueries({ queryKey: developerKeys.mine() });
      if (dev?.id) qc.invalidateQueries({ queryKey: developerKeys.byId(dev.id) });
    },
  });
}
