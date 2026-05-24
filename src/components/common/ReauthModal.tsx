import { useState } from "react";
import { Lock } from "lucide-react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface Props {
  open: boolean;
  reason?: string;
  onClose: () => void;
  /** Called after successful reauth. The caller should retry the mutation. */
  onSuccess: () => void;
}

/**
 * Password-based reauthentication modal. Shown when a sensitive Cloud
 * Function returns `failed-precondition` with code `requires-recent-login`.
 *
 * For owner / MFA-protected accounts, Firebase prompts for the second
 * factor automatically as part of the reauth flow if needed.
 */
export function ReauthModal({ open, reason, onClose, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const user = getFirebaseAuth().currentUser;
    if (!user?.email) {
      setError("No signed-in account found.");
      return;
    }
    setSubmitting(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setPassword("");
      onSuccess();
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Reauthentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-[400px] max-w-[90vw] space-y-4 rounded-xl border border-separator bg-card p-5"
      >
        <header className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-acid" />
          <h2 className="text-[14px] font-semibold text-foreground">
            Confirm your password
          </h2>
        </header>
        <p className="text-[12px] text-muted/65">
          {reason ?? "This action is sensitive. Re-enter your password to continue."}
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-md bg-input px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-acid/40"
        />
        {error && (
          <p className="text-[11.5px] text-red">{error}</p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[12px] text-muted/75 hover:bg-card-hover"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className="rounded-md bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:bg-acid/80 disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Confirm"}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Convenience hook + helper: wraps a mutation and shows the reauth modal
 * when the server requests fresh login. Returns the modal element + a
 * `run(fn)` callback you can wrap any mutation with.
 */
export function useReauthRunner() {
  const [open, setOpen] = useState(false);
  const [pendingFn, setPendingFn] = useState<(() => Promise<unknown>) | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);

  function isRequiresRecentLogin(err: unknown): boolean {
    const e = err as { code?: string; details?: { code?: string } };
    return (
      e?.code === "functions/failed-precondition" &&
      e?.details?.code === "requires-recent-login"
    );
  }

  async function run<T>(fn: () => Promise<T>, msg?: string): Promise<T | undefined> {
    try {
      return await fn();
    } catch (err) {
      if (isRequiresRecentLogin(err)) {
        setReason(msg ?? "This action requires a fresh sign-in.");
        setPendingFn(() => fn);
        setOpen(true);
        return undefined;
      }
      throw err;
    }
  }

  function modal() {
    return (
      <ReauthModal
        open={open}
        reason={reason}
        onClose={() => {
          setOpen(false);
          setPendingFn(null);
        }}
        onSuccess={() => {
          if (pendingFn) void pendingFn();
        }}
      />
    );
  }

  return { run, modal };
}
