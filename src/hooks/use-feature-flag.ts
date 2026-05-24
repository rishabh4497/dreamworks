import { useEffect, useState } from "react";
import { loadExperiments, resolveFlag } from "@/lib/feature-flags";
import { useAuthStore } from "@/stores/auth-store";

/**
 * Returns the assigned variant id for a feature flag, or null while loading
 * or when no experiment is running. Fires a `feature_flag_exposure` event
 * the first time a variant is resolved for the session.
 */
export function useFeatureFlag(flagKey: string): string | null {
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : null;
  const [variant, setVariant] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void loadExperiments().then(() => {
      if (cancelled) return;
      setVariant(resolveFlag(flagKey, uid));
    });
    return () => {
      cancelled = true;
    };
  }, [flagKey, uid]);
  return variant;
}
