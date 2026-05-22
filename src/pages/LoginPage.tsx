import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
const logoSrc = "/logo.png";
import { useAuthStore } from "@/stores/auth-store";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";

function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const spacing = 24;
    const cols = Math.ceil(w / spacing) + 1;
    const rows = Math.ceil(h / spacing) + 1;
    const cx = w / 2;
    const cy = h / 2;
    const time = Date.now() * 0.0008;
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";

    ctx.clearRect(0, 0, w, h);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * spacing;
        const y = row * spacing;
        const dx = (x - cx) / w;
        const dy = (y - cy) / h;

        const wave1 = Math.sin(y * 0.008 + x * 0.003 - time * 2.0);
        const wave2 = Math.sin(x * 0.006 - y * 0.004 + time * 1.2);
        const combined = (wave1 + wave2) * 0.5;

        const edgeFade = 1 - Math.max(Math.abs(dx), Math.abs(dy)) * 1.2;
        const fade = Math.max(0, edgeFade);

        const opacity = (0.1 + combined * 0.12) * fade;
        const radius = 1.4 + combined * 0.4;

        if (opacity <= 0) continue;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${opacity})`
          : `rgba(0, 0, 0, ${opacity})`;
        ctx.fill();
      }
    }

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.8 }}
    />
  );
}

export function LoginPage() {
  const authState = useAuthStore((s) => s.authState);
  const signInWithEmail = useAuthStore((s) => s.signInWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);

  useEffect(() => {
    if (authState.type === "Authenticated") navigate("/store", { replace: true });
  }, [authState, navigate]);

  const isAuthenticating = authState.type === "Authenticating";

  const onGoogleSignIn = () => {
    toast.info("Signing in via Google…");
    signInWithGoogle().catch((err: any) => {
      toast.error(err?.message || "Failed to sign in with Google.");
    });
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Please enter a valid email address.");
      return;
    }
    if (pw.length < 6) {
      setEmailErr("Password must be at least 6 characters.");
      return;
    }
    if (isSignUp) {
      if (!displayName.trim()) {
        setEmailErr("Please enter a display name.");
        return;
      }
      signUpWithEmail(email, pw, displayName).catch((err: any) => {
        setEmailErr(err.message || "Failed to create account.");
      });
    } else {
      signInWithEmail(email, pw).catch((err: any) => {
        setEmailErr(err.message || "Failed to sign in.");
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center relative overflow-hidden">
        <DotGrid />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-[380px] px-6"
        >
          <div className="mb-8 text-center">
            <img src={logoSrc} alt="Dreamworks" className="mx-auto mb-4 h-14 w-14 rounded-2xl" />
            <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Dreamworks</h1>
            <p className="mt-1.5 text-[13px] text-muted/50">Discover, buy, and track games.</p>
          </div>

          <div className="rounded-2xl border border-separator bg-card p-6 space-y-4">
            <button
              onClick={onGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-separator bg-card hover:bg-card-active py-3 text-[13px] font-semibold text-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.84 14.93 1 12 1 7.37 1 3.42 3.66 1.5 7.57l3.79 2.93C6.2 7.51 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.48-1.12 2.73-2.37 3.57v2.97h3.83c2.24-2.06 3.59-5.09 3.59-8.64z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.83-2.97c-1.08.72-2.45 1.16-4.1 1.16-3.13 0-5.8-2.47-6.71-5.46L1.5 15.75C3.42 19.66 7.37 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.29 12.82c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.5 7.57C.54 9.36 0 11.36 0 13.5s.54 4.14 1.5 5.93l3.79-2.93c-.23-.69-.36-1.43-.36-2.2z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-separator" />
              <span className="text-[10px] uppercase tracking-widest text-muted/40">or</span>
              <div className="flex-1 border-t border-separator" />
            </div>

            <form onSubmit={onEmailSubmit} className="space-y-3">
              {isSignUp && (
                <Input
                  type="text"
                  placeholder="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              {(emailErr || (authState.type === "Error" && authState.message)) && (
                <p className="text-[11px] text-red">
                  {emailErr || (authState.type === "Error" && authState.message)}
                </p>
              )}
              
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full rounded-xl bg-acid py-3 text-[13px] font-semibold text-background hover:brightness-110 disabled:opacity-50 cursor-pointer"
              >
                {isAuthenticating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Please wait…
                  </span>
                ) : (
                  isSignUp ? "Create Account" : "Sign in"
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setEmailErr(null);
                }}
                className="w-full text-[12px] text-muted hover:text-foreground/80 cursor-pointer"
              >
                {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
              </button>
            </form>

            <p className="text-center text-[11px] text-muted/40 pt-3 border-t border-separator">
              Fully functional Firebase auth — credentials will sync to Firestore.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
