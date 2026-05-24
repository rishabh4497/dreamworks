import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { multiFactor } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/auth-store";
import { Card } from "@/components/ui/card";

/**
 * Visible only to the owner account (role === "owner") when no MFA second
 * factor is enrolled. Blocks the authenticated UI behind a hard banner with
 * a CTA to enroll TOTP.
 *
 * Enrollment itself happens in the Settings page (or a dedicated
 * `/account/security` page). This component is a guard / nag — it does not
 * itself drive the enrollment.
 */
export function MfaEnrollmentGate({ children }: { children: React.ReactNode }) {
  const profile = useAuthStore((s) => s.profile);
  const [enrolled, setEnrolled] = useState<boolean | null>(null);

  useEffect(() => {
    if (profile?.role !== "owner") {
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
  }, [profile?.role, profile?.uid]);

  if (profile?.role !== "owner" || enrolled !== false) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md">
      <Card className="w-[500px] max-w-[90vw] space-y-3 border-orange/40 bg-orange/5 p-6">
        <div className="flex items-center gap-2 text-orange">
          <ShieldAlert className="h-5 w-5" />
          <h2 className="text-[16px] font-semibold">Owner accounts require 2FA</h2>
        </div>
        <p className="text-[13px] text-foreground/80 leading-relaxed">
          You're signed in as the Dreamworks owner. Multi-factor authentication
          (TOTP) is mandatory before you can access admin features. This is to
          prevent a compromised password from giving someone full control of
          the platform.
        </p>
        <ol className="ml-4 list-decimal space-y-1 text-[12.5px] text-muted/80">
          <li>Open Settings → Security.</li>
          <li>Click "Enroll TOTP" and scan the QR code with an authenticator app.</li>
          <li>Sign out and sign back in to mint the owner claim.</li>
        </ol>
        <a
          href="/settings"
          className="inline-flex items-center justify-center rounded-md bg-orange px-3 py-1.5 text-[12.5px] font-semibold text-background hover:bg-orange/80"
        >
          Open Settings
        </a>
      </Card>
    </div>
  );
}
