declare global {
  interface Window {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
  }
}

export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

export function getOS(): "windows" | "mac" | "linux" | "web" {
  if (typeof navigator === "undefined") return "web";
  if (!isDesktop()) return "web";
  const ua = navigator.userAgent;
  if (ua.includes("Mac")) return "mac";
  if (ua.includes("Win")) return "windows";
  return "linux";
}

export async function openExternal(url: string): Promise<void> {
  if (isDesktop()) {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
    return;
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export async function notify(title: string, body: string): Promise<void> {
  if (isDesktop()) {
    const { sendNotification, isPermissionGranted, requestPermission } = await import(
      "@tauri-apps/plugin-notification"
    );
    let granted = await isPermissionGranted();
    if (!granted) {
      granted = (await requestPermission()) === "granted";
    }
    if (granted) await sendNotification({ title, body });
    return;
  }
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }
}

export async function invokeDesktop<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T | null> {
  if (!isDesktop()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

// ── Filesystem helpers (desktop-only, NO-OP on web) ─────────────────────────
//
// All file/path operations go through these wrappers so the scanner modules
// (and any future filesystem readers) stay free of `@tauri-apps/*` imports.

export interface ReadDirEntry {
  name: string;
  isFile: boolean;
}

export async function readTextFileSafe(path: string): Promise<string | null> {
  if (!isDesktop()) return null;
  try {
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    return await readTextFile(path);
  } catch {
    return null;
  }
}

export async function readDirSafe(path: string): Promise<ReadDirEntry[]> {
  if (!isDesktop()) return [];
  try {
    const { readDir } = await import("@tauri-apps/plugin-fs");
    const entries = await readDir(path);
    return entries.map((e) => ({
      name: e.name ?? "",
      isFile: Boolean(e.isFile),
    }));
  } catch {
    return [];
  }
}

export async function pathExistsSafe(path: string): Promise<boolean> {
  if (!isDesktop()) return false;
  try {
    const { exists } = await import("@tauri-apps/plugin-fs");
    return await exists(path);
  } catch {
    return false;
  }
}

/**
 * Resolves the user's home directory. On desktop calls Tauri's path helper;
 * on web returns "/" (the scanner won't run there but callers can still
 * preview the path shape in the consent modal).
 */
export async function homeDirSafe(): Promise<string> {
  if (!isDesktop()) return "/";
  try {
    const { homeDir } = await import("@tauri-apps/api/path");
    const home = await homeDir();
    return home.replace(/\/+$/, "");
  } catch {
    return "/";
  }
}

// ── Asset uploads ──────────────────────────────────────────────────────────
//
// Single funnel for any binary the developer portal needs to persist — build
// artifacts, capsule art, banners, achievement icons. Tries Firebase Storage
// first; if the project isn't configured for it (common in local dev), falls
// back to inlining as a data URL so the UI can still preview small files.

export interface UploadedAsset {
  url: string;
  sizeBytes: number;
}

async function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export async function uploadAsset(file: File | Blob, path: string): Promise<UploadedAsset> {
  const sizeBytes = file.size;
  try {
    const [{ getStorage, ref, uploadBytes, getDownloadURL }, { getFirebaseApp }] = await Promise.all([
      import("firebase/storage"),
      import("./firebase"),
    ]);
    const storage = getStorage(getFirebaseApp());
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return { url, sizeBytes };
  } catch {
    // Storage bucket not configured (or offline) — fall back to a data URL so
    // the UI can still display the asset locally. Large files will balloon
    // Firestore docs; that's an acceptable tradeoff in dev/preview.
    const url = await readAsDataUrl(file);
    return { url, sizeBytes };
  }
}
