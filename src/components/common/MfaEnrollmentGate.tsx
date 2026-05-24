import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { multiFactor } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import { Card } from "@/components/ui/card";

/**
 * Soft nag for top admins (role=admin with the "*" preset) when no MFA
 * second factor is enrolled. Renders a banner above children but does NOT
 * block — kept as advisory after the owner role was collapsed into admin.
 */
export function MfaEnrollmentGate({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);

  const isTopAdmin =
    profile?.role === "admin" &&
    Array.isArray(profile?.permissions) &&
    profile.permissions.includes("*");

  useEffect(() => {
    if (!isTopAdmin) {
      setEnrolled(true);
      return;
    }
    const user = getFirebaseAuth().currentUser;
    if (!user) {
      setEnrolled(true);
      return;
    }
    try {
      const factors = multiFactor(user).enrolledFactors ?? [];
      setEnrolled(factors.length > 0);
    } catch {
      setEnrolled(true);
    }
  }, [isTopAdmin, profile?.uid]);

  if (!isTopAdmin || enrolled !== false) {
    return <>{children}</>;
  }

  return (
    <>
      <Card className="mb-4 border-orange/40 bg-orange/5 p-3">
        <div className="flex items-center gap-2 text-[12.5px] text-orange">
          <ShieldAlert className="h-4 w-4" />
          <span>
            <strong>Heads up:</strong> you're signed in as the top admin without
            2FA. Enroll TOTP in Settings → Security for production-grade protection.
          </span>
        </div>
      </Card>
      {children}
    </>
  );
}
