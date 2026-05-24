import { create } from "zustand";
import type { AuthStateResponse, UserProfile, UserRole } from "@/lib/types";
import { DEFAULT_AVATAR_OPTIONS, type AvatarOptions } from "@/lib/avatar";
import { getFirebaseAuth, getDb, COLLECTIONS } from "@/lib/firebase";
import { claimAdminIfAllowlisted } from "@/lib/api/admin";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { isDesktop, openExternal } from "@/lib/platform";

interface AuthStore {
  authState: AuthStateResponse;
  profile: UserProfile | null;
  signInWithEmail: (email: string, pw: string) => Promise<void>;
  signUpWithEmail: (email: string, pw: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  updateAvatar: (options: AvatarOptions) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

let isInitialized = false;
let unsubscribeSnapshot: (() => void) | null = null;

async function handleUserAuth(user: User | null) {
  if (unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }

  if (!user) {
    useAuthStore.setState({
      authState: { type: "Anonymous" },
      profile: null
    });
    return;
  }

  useAuthStore.setState({ authState: { type: "Authenticating" } });

  const userRef = doc(getDb(), COLLECTIONS.users, user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const initialDoc = {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "User",
        photoURL: user.photoURL || "",
        approved: false,
        inviteCode: null,
        role: "user",
        permissions: [],
        createdAt: serverTimestamp(),
        // launcher specific
        level: 1,
        bio: "",
        country: "India",
        memberSince: new Date().toISOString(),
        showcaseGameIds: [],
        isSubscribed: false,
        avatarOptions: DEFAULT_AVATAR_OPTIONS,
      };
      await setDoc(userRef, initialDoc);
    }

    unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const profile: UserProfile = {
          uid: data.uid || user.uid,
          email: data.email || user.email || "",
          displayName: data.displayName || user.displayName || "User",
          avatarUrl: data.photoURL || `https://picsum.photos/seed/${user.uid}/96/96`,
          avatarOptions: data.avatarOptions || DEFAULT_AVATAR_OPTIONS,
          level: typeof data.level === "number" ? data.level : 1,
          bio: data.bio || "",
          country: data.country || "India",
          memberSince: data.memberSince || new Date().toISOString(),
          showcaseGameIds: data.showcaseGameIds || [],
          isSubscribed: !!data.isSubscribed,
          role: ((data.role as UserRole) ?? "user"),
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          suspended: !!data.suspended,
        };

        useAuthStore.setState({
          authState: {
            type: "Authenticated",
            user: {
              uid: profile.uid,
              email: profile.email,
              displayName: profile.displayName,
            }
          },
          profile,
        });
      }
    }, (err) => {
      console.error("User snapshot subscription error:", err);
      useAuthStore.setState({
        authState: { type: "Error", message: err.message },
        profile: null
      });
    });

    // Bootstrap: legacy callable is now a no-op (ADMIN_EMAILS allowlist no
    // longer auto-promotes after the access-control redo). Keep the call for
    // back-compat but expect { admin: false }.
    try {
      const tokenResult = await user.getIdTokenResult();
      if (!tokenResult.claims.admin) {
        const result = await claimAdminIfAllowlisted();
        if (result.admin) {
          await user.getIdToken(true);
        }
      }
      // Bootstrap admin: mint the admin claim if the caller's uid matches
      // the OWNER_UID secret. The Cloud Function silently refuses otherwise.
      if (!tokenResult.claims.admin) {
        try {
          const { httpsCallable } = await import("firebase/functions");
          const { getFirebaseFunctions } = await import("@/lib/firebase");
          const bootstrap = httpsCallable<unknown, { admin: boolean; reason?: string }>(
            getFirebaseFunctions(),
            "claimOwnerIfEligible",
          );
          const bootstrapRes = await bootstrap({});
          if (bootstrapRes.data?.admin) {
            await user.getIdToken(true);
          }
        } catch (bootstrapErr) {
          console.debug("bootstrap admin attempt skipped", bootstrapErr);
        }
      }
    } catch (claimErr) {
      console.debug("admin claim bootstrap skipped", claimErr);
    }
  } catch (error: any) {
    console.error("Error loading or creating user profile:", error);
    useAuthStore.setState({
      authState: { type: "Error", message: error?.message || "Failed to load profile" },
      profile: null
    });
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authState: { type: "Anonymous" },
  profile: null,
  initialize: () => {
    if (isInitialized) return;
    isInitialized = true;
    onAuthStateChanged(getFirebaseAuth(), (user) => {
      void handleUserAuth(user);
    });
  },
  signInWithEmail: async (email, pw) => {
    set({ authState: { type: "Authenticating" } });
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, pw);
    } catch (err: any) {
      console.error("Email sign in error", err);
      set({ authState: { type: "Error", message: err.message || "Sign in failed" } });
      throw err;
    }
  },
  signUpWithEmail: async (email, pw, displayName) => {
    set({ authState: { type: "Authenticating" } });
    try {
      const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, pw);
      const userRef = doc(getDb(), COLLECTIONS.users, credential.user.uid);
      const initialDoc = {
        uid: credential.user.uid,
        email: email,
        displayName: displayName || email.split("@")[0],
        photoURL: "",
        approved: false,
        inviteCode: null,
        role: "user",
        permissions: [],
        createdAt: serverTimestamp(),
        // launcher specific
        level: 1,
        bio: "",
        country: "India",
        memberSince: new Date().toISOString(),
        showcaseGameIds: [],
        isSubscribed: false,
        avatarOptions: DEFAULT_AVATAR_OPTIONS,
      };
      await setDoc(userRef, initialDoc);
    } catch (err: any) {
      console.error("Email sign up error", err);
      set({ authState: { type: "Error", message: err.message || "Sign up failed" } });
      throw err;
    }
  },
  signInWithGoogle: async () => {
    set({ authState: { type: "Authenticating" } });
    if (isDesktop()) {
      return new Promise<void>((resolve, reject) => {
        const sessionId = "tauri_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const docRef = doc(getDb(), "dw_auth_sessions", sessionId);

        let resolved = false;

        const unsubscribe = onSnapshot(
          docRef,
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              if (data && data.idToken) {
                resolved = true;
                unsubscribe();
                clearTimeout(timeoutId);

                try {
                  const credential = GoogleAuthProvider.credential(data.idToken, data.accessToken || null);
                  await signInWithCredential(getFirebaseAuth(), credential);
                  // Clean up document
                  await deleteDoc(docRef);
                  resolve();
                } catch (err: any) {
                  console.error("Desktop Auth exchange error:", err);
                  set({ authState: { type: "Error", message: err.message || "Failed exchange" } });
                  // Clean up document anyway
                  void deleteDoc(docRef).catch(() => {});
                  reject(err);
                }
              }
            }
          },
          (err) => {
            if (!resolved) {
              resolved = true;
              unsubscribe();
              clearTimeout(timeoutId);
              set({ authState: { type: "Error", message: err.message } });
              reject(err);
            }
          }
        );

        // Timeout after 2 minutes
        const timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            unsubscribe();
            set({ authState: { type: "Error", message: "Google Authentication timed out. Please try again." } });
            void deleteDoc(docRef).catch(() => {});
            reject(new Error("Authentication timed out."));
          }
        }, 120000);

        // Open external system browser to authorize
        const authHelperUrl = `http://localhost:5173/auth-helper?sessionId=${sessionId}`;
        openExternal(authHelperUrl).catch((err) => {
          if (!resolved) {
            resolved = true;
            unsubscribe();
            clearTimeout(timeoutId);
            set({ authState: { type: "Error", message: "Failed to open browser: " + err.message } });
            reject(err);
          }
        });
      });
    } else {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getFirebaseAuth(), provider);
      } catch (err: any) {
        console.error("Google sign in error", err);
        set({ authState: { type: "Error", message: err.message || "Sign in failed" } });
        throw err;
      }
    }
  },
  signOut: async () => {
    if (unsubscribeSnapshot) {
      unsubscribeSnapshot();
      unsubscribeSnapshot = null;
    }
    await firebaseSignOut(getFirebaseAuth());
    set({ authState: { type: "Anonymous" }, profile: null });
  },
  updateAvatar: async (options) => {
    const profile = get().profile;
    if (!profile) return;
    // Optimistic local update so the UI (profile page, settings card,
    // sidebar, topbar) reflects the new avatar immediately. The Firestore
    // snapshot listener will reconcile shortly after.
    set({ profile: { ...profile, avatarOptions: options } });
    const userRef = doc(getDb(), COLLECTIONS.users, profile.uid);
    try {
      await updateDoc(userRef, { avatarOptions: options });
    } catch (err) {
      console.error("Failed to update avatar in Firestore", err);
      // Roll back so the UI doesn't lie about what's persisted.
      set({ profile });
      throw err;
    }
  },
  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return;
    const userRef = doc(getDb(), COLLECTIONS.users, profile.uid);
    try {
      const mappedUpdates: Record<string, any> = {};
      if (updates.displayName !== undefined) mappedUpdates.displayName = updates.displayName;
      if (updates.level !== undefined) mappedUpdates.level = updates.level;
      if (updates.bio !== undefined) mappedUpdates.bio = updates.bio;
      if (updates.country !== undefined) mappedUpdates.country = updates.country;
      if (updates.showcaseGameIds !== undefined) mappedUpdates.showcaseGameIds = updates.showcaseGameIds;
      if (updates.isSubscribed !== undefined) mappedUpdates.isSubscribed = updates.isSubscribed;
      if (updates.avatarUrl !== undefined) mappedUpdates.photoURL = updates.avatarUrl;

      await updateDoc(userRef, mappedUpdates);
    } catch (err) {
      console.error("Failed to update profile in Firestore", err);
    }
  },
}));

