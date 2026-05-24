import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import {
  claimAdminInvite,
  claimCreatorInvite,
} from "@/lib/api/creator-applications";
import { ROUTES } from "@/lib/routes";

/**
 * Public landing page for magic-link invite claims. Handles both creator
 * (developer / publisher) and admin invites — tries creator first, then
 * admin, since the user doesn't tell us which they were issued.
 */
export function ClaimInvitePage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const authState = useAuthStore((s) => s.authState);
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"idle" | "claiming" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [result, setResult] = useState<{ kind?: string; preset?: string; entityId?: string }>({});

  useEffect(() => {
    if (!token) {
      setPhase("error");
      setMessage("Missing invite token.");
      return;
    }
    if (authState.type === "Anonymous" || authState.type === "Authenticating") {
      // Wait for sign-in. The user lands here via Firebase Auth magic link,
      // which signs them in automatically; AppLayout will gate them.
      return;
    }
    if (authState.type !== "Authenticated") return;
    if (phase !== "idle") return;
    void runClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.type, token]);

  async function runClaim() {
    setPhase("claiming");
    try {
      // Try creator first
      const cres = await claimCreatorInvite(token);
      setPhase("done");
      setResult({ kind: cres.kind, entityId: cres.entityId });
      setMessage(`You're now a ${cres.kind}!`);
      return;
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code !== "functions/not-found") {
        // Not a "wrong type of invite" error — try admin or fail
        if (e.code === "functions/permission-denied" || e.code === "functions/failed-precondition") {
          setPhase("error");
          setMessage(e.message ?? "Invite cannot be claimed.");
          return;
        }
      }
    }
    try {
      const ares = await claimAdminInvite(token);
      setPhase("done");
      setResult({ preset: ares.preset });
      setMessage("You're now an admin teammate.");
    } catch (err) {
      const e = err as { message?: string };
      setPhase("error");
      setMessage(e.message ?? "Invite not found or already claimed.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl py-16"
    >
      <Card className="p-6 text-center space-y-4">
        {phase === "idle" && (
          <>
            <KeyRound className="mx-auto h-7 w-7 text-acid" />
            <h2 className="text-[16px] font-semibold text-foreground">Claim your invite</h2>
            <p className="text-[13px] text-muted/65">
              {authState.type === "Authenticated"
                ? "Validating your invite token…"
                : "Sign in first to claim your invite. If you arrived via a magic link, sign-in is automatic."}
            </p>
            {authState.type !== "Authenticated" && (
              <Link
                to={ROUTES.login}
                className="inline-block rounded-md bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:bg-acid/80"
              >
                Go to sign-in
              </Link>
            )}
          </>
        )}
        {phase === "claiming" && (
          <>
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-acid" />
            <p className="text-[13px] text-muted/65">Claiming…</p>
          </>
        )}
        {phase === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-7 w-7 text-green" />
            <h2 className="text-[16px] font-semibold text-foreground">{message}</h2>
            {result.entityId && (
              <p className="text-[12px] text-muted/60">
                Entity slug: <span className="font-mono text-foreground/85">{result.entityId}</span>
              </p>
            )}
            {result.preset && (
              <p className="text-[12px] text-muted/60">
                Preset applied: <span className="font-mono text-foreground/85">{result.preset}</span>
              </p>
            )}
            <button
              type="button"
              onClick={() =>
                navigate(result.kind ? ROUTES.developerPortal : result.preset ? ROUTES.admin : ROUTES.store)
              }
              className="rounded-md bg-acid px-4 py-2 text-[13px] font-semibold text-background hover:bg-acid/80"
            >
              Continue
            </button>
          </>
        )}
        {phase === "error" && (
          <>
            <ShieldAlert className="mx-auto h-6 w-6 text-red" />
            <h2 className="text-[15px] font-semibold text-foreground">Cannot claim</h2>
            <p className="text-[12.5px] text-red/85">{message}</p>
            <Link
              to={ROUTES.store}
              className="inline-block rounded-md bg-input px-3 py-1.5 text-[12px] font-medium text-foreground/85 hover:bg-card-hover"
            >
              Back to store
            </Link>
          </>
        )}
      </Card>
    </motion.div>
  );
}
