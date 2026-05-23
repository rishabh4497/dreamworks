import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "@/lib/firebase";

const AUTH_SESSIONS_COLLECTION = "dw_auth_sessions";

/**
 * Completes a desktop-handoff Google sign-in: pops up the Google auth flow in
 * the browser, then writes the resulting credentials to the auth-session doc
 * the desktop app is listening on.
 */
export async function completeDesktopAuthSession(sessionId: string): Promise<void> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential || !credential.idToken) {
    throw new Error("Failed to retrieve credentials from Google.");
  }
  await setDoc(doc(getDb(), AUTH_SESSIONS_COLLECTION, sessionId), {
    idToken: credential.idToken,
    accessToken: credential.accessToken ?? null,
    createdAt: new Date().toISOString(),
  });
}
