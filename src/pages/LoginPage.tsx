import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import logoSrc from "@/assets/logo.svg";
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
  const startSignIn = useAuthStore((s) => s.startSignIn);
  const navigate = useNavigate();
  const [mode, setMode] = useState<"buttons" | "email">("buttons");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);

  useEffect(() => {
    if (authState.type === "Authenticated") navigate("/store", { replace: true });
  }, [authState, navigate]);

  const isAuthenticating = authState.type === "Authenticating";

  const onSocial = (provider: string) => {
    toast.info(`Signing in via ${provider}…`);
    void startSignIn();
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
    void startSignIn();
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
            {mode === "buttons" ? (
              <>
                <button
                  onClick={() => onSocial("Dreamworks")}
                  disabled={isAuthenticating}
                  className="w-full rounded-xl bg-acid py-3 text-[13px] font-semibold text-background hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {isAuthenticating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Signing you in…
                    </span>
                  ) : (
                    "Sign in to Dreamworks"
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-separator" />
                  <span className="text-[10px] uppercase tracking-widest text-muted/40">or</span>
                  <div className="flex-1 border-t border-separator" />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onSocial("Google")}
                    disabled={isAuthenticating}
                    className="rounded-xl border border-separator bg-card py-2 text-[11px] font-medium text-foreground/80 hover:bg-card-active disabled:opacity-50"
                  >
                    Google
                  </button>
                  <button
                    onClick={() => onSocial("Steam")}
                    disabled={isAuthenticating}
                    className="rounded-xl border border-separator bg-card py-2 text-[11px] font-medium text-foreground/80 hover:bg-card-active disabled:opacity-50"
                  >
                    Steam
                  </button>
                  <button
                    onClick={() => onSocial("Discord")}
                    disabled={isAuthenticating}
                    className="rounded-xl border border-separator bg-card py-2 text-[11px] font-medium text-foreground/80 hover:bg-card-active disabled:opacity-50"
                  >
                    Discord
                  </button>
                </div>

                <button
                  onClick={() => setMode("email")}
                  className="w-full text-[12px] text-muted hover:text-foreground/80"
                >
                  Use email and password instead →
                </button>
              </>
            ) : (
              <form onSubmit={onEmailSubmit} className="space-y-3">
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
                {emailErr && <p className="text-[11px] text-red">{emailErr}</p>}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full rounded-xl bg-acid py-3 text-[13px] font-semibold text-background hover:brightness-110 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    "Sign in"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("buttons")}
                  className="w-full text-[12px] text-muted hover:text-foreground/80"
                >
                  ← Back to sign-in options
                </button>
              </form>
            )}

            <p className="text-center text-[11px] text-muted/40 pt-3 border-t border-separator">
              Mock auth — any sign-in drops you into the demo account.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
