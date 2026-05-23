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

/**
 * Subscribe to a Tauri event emitted from the Rust backend (e.g. the live
 * resource monitor stream). Returns an unlisten function; on web returns a
 * no-op so callers can use the same effect cleanup shape on both platforms.
 */
export type UnlistenFn = () => void;

export async function listenEvent<T>(
  event: string,
  cb: (payload: T) => void,
): Promise<UnlistenFn> {
  if (!isDesktop()) return () => {};
  const { listen } = await import("@tauri-apps/api/event");
  return listen<T>(event, (e) => cb(e.payload));
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
// artifacts, capsule art, banners, achievement icons. All Storage paths use
// the `dw_` prefix convention so they sit alongside the `dw_*` Firestore
// collections.

export interface UploadedAsset {
  url: string;
  sizeBytes: number;
}

export interface UploadOptions {
  /**
   * What to do when Firebase Storage is unreachable / misconfigured.
   * - `"data-url"` (default): inline the file as a base64 data URL so the UI
   *   keeps working in local dev without a Storage bucket. Convenient but
   *   bloats Firestore docs.
   * - `"throw"`: surface the original Storage error so the caller can show a
   *   real "couldn't upload" UI. Use this for production-shaped flows
   *   (image dropzone, build upload) where silent fallback hides bugs.
   */
  onStorageError?: "data-url" | "throw";
  /** Override the inferred content-type. Defaults to file.type or octet-stream. */
  contentType?: string;
}

async function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export async function uploadAsset(
  file: File | Blob,
  path: string,
  options: UploadOptions = {},
): Promise<UploadedAsset> {
  const sizeBytes = file.size;
  const fallback = options.onStorageError ?? "data-url";
  try {
    const [{ getStorage, ref, uploadBytes, getDownloadURL }, { getFirebaseApp }] = await Promise.all([
      import("firebase/storage"),
      import("./firebase"),
    ]);
    const storage = getStorage(getFirebaseApp());
    const storageRef = ref(storage, path);
    const contentType =
      options.contentType ??
      (file instanceof File && file.type ? file.type : undefined) ??
      "application/octet-stream";
    await uploadBytes(storageRef, file, { contentType });
    const url = await getDownloadURL(storageRef);
    return { url, sizeBytes };
  } catch (err) {
    if (fallback === "throw") throw err;
    const url = await readAsDataUrl(file);
    return { url, sizeBytes };
  }
}

/** Convert a base64 data URL into a Blob, preserving content type. Useful when
 * the source is a `<canvas>.toDataURL()` and the caller wants to upload via
 * `uploadAsset` instead of storing the inline base64. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Not a base64 data URL");
  const [, mime, b64] = match;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
