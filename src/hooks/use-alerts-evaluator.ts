import { useEffect } from "react";
import { evaluateAlertRules } from "@/lib/api/telemetry-advanced";
import { useAuthStore } from "@/stores/auth-store";

const EVAL_INTERVAL_MS = 5 * 60 * 1000; // every 5 min

/**
 * Mounts a recurring evaluator that runs alert rules every 5 minutes. Only
 * active for admin users — non-admins lack the read perms anyway, so the
 * evaluator would error out silently. Cleaned up on unmount.
 */
export function useAlertsEvaluator(): void {
  const auth = useAuthStore((s) => s.authState);
  const profile = useAuthStore((s) => s.profile);
  useEffect(() => {
    if (auth.type !== "Authenticated") return;
    if (profile?.role !== "admin") return;
    void evaluateAlertRules();
    const id = setInterval(() => void evaluateAlertRules(), EVAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [auth, profile?.role]);
}
