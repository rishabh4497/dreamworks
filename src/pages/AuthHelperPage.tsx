import { useState, useEffect } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "@/lib/firebase";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function AuthHelperPage() {
  const [status, setStatus] = useState<"idle" | "authenticating" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("sessionId");
    setSessionId(id);
    if (!id) {
      setStatus("error");
      setErrorMsg("Missing sessionId parameter in URL.");
    }
  }, []);

  const handleSignIn = async () => {
    if (!sessionId) return;
    setStatus("authenticating");
    setErrorMsg(null);

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential || !credential.idToken) {
        throw new Error("Failed to retrieve credentials from Google.");
      }

      setStatus("saving");
      
      // Save credentials under dw_auth_sessions collection in Firestore
      await setDoc(doc(getDb(), "dw_auth_sessions", sessionId), {
        idToken: credential.idToken,
        accessToken: credential.accessToken || null,
        createdAt: new Date().toISOString(),
      });

      setStatus("success");
    } catch (err: any) {
      console.error("Browser Auth Error:", err);
      setStatus("error");
      setErrorMsg(err?.message || "An unknown error occurred during sign in.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-foreground">
      <div className="w-full max-w-[420px] rounded-2xl border border-neutral-800 bg-[#121214] p-8 text-center shadow-xl">
        <div className="mb-6 flex justify-center">
          <img loading="lazy" decoding="async" src="/logo.png" alt="Dreamworks" className="h-16 w-16 rounded-2xl" />
        </div>

        <h1 className="text-xl font-bold tracking-tight text-white">
          Dreamworks Desktop Login Helper
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Authorize Google Sign-In for your Dreamworks Desktop App
        </p>

        <div className="mt-8 border-t border-neutral-800 pt-6">
          {status === "idle" && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-400">
                Click the button below to authorize the desktop application.
              </p>
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 py-3 text-sm font-semibold text-white transition-all cursor-pointer"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                <span>Authorize with Google</span>
              </button>
            </div>
          )}

          {(status === "authenticating" || status === "saving") && (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="text-sm text-neutral-400">
                {status === "authenticating" ? "Signing in with Google..." : "Connecting to desktop app..."}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="py-6 flex flex-col items-center justify-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="text-base font-medium text-emerald-400">Authenticated successfully!</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-[280px]">
                You can now safely close this browser tab and return to the Dreamworks app.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="py-4 flex flex-col items-center justify-center gap-3">
              <AlertCircle className="h-10 w-10 text-rose-500" />
              <p className="text-sm font-medium text-rose-400">Authentication Failed</p>
              <p className="text-xs text-neutral-400 max-w-[300px]">
                {errorMsg || "An unknown error occurred."}
              </p>
              {sessionId && (
                <button
                  onClick={handleSignIn}
                  className="mt-2 text-xs font-semibold text-neutral-300 underline hover:text-white cursor-pointer"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
