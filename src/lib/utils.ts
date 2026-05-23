import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DownloadLimitOption } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UNLIMITED_BPS = 42_000_000;

export function bytesPerSecondForLimit(limit: DownloadLimitOption): number {
  if (limit === "unlimited") return UNLIMITED_BPS;
  return Number(limit) * 1_000_000;
}

export function formatSpeedBytes(bps: number): string {
  if (bps <= 0) return "--";
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} MB/s`;
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} KB/s`;
  return `${Math.round(bps)} B/s`;
}

export function formatPrice(minorUnits: number, currency: string = "INR"): string {
  if (!Number.isFinite(minorUnits)) return "—";
  if (minorUnits === 0) return "Free";
  const value = minorUnits / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  if (hours < 10) return `${hours.toFixed(1)} hrs`;
  return `${Math.round(hours).toLocaleString()} hrs`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function relativeDate(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - target;
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days < 1) return "Today";
  if (days < 2) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

/**
 * Short relative-time string ("Just now", "5m ago", "3h ago", "2d ago") with
 * caller-provided i18n. `t` is the translator returned from useTranslation();
 * pass a no-op identity function in non-React contexts.
 */
export function relativeTime(
  iso: string,
  t: (key: string, vars?: Record<string, string | number>) => string,
): string {
  const elapsedMs = Date.now() - new Date(iso).getTime();
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  if (seconds < 60) return t("Just now");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("{n}m ago", { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("{n}h ago", { n: hours });
  const days = Math.floor(hours / 24);
  return t("{n}d ago", { n: days });
}

export function discountPct(base: number, final: number): number {
  if (base <= 0 || final >= base) return 0;
  return Math.round(((base - final) / base) * 100);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/**
 * Stable url-safe slug for a name like "FromSoftware" → "fromsoftware",
 * "CD PROJEKT RED" → "cd-projekt-red". Used for /developer/:slug,
 * /publisher/:slug, and /store/tag/:slug routes.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseScreenshots(raw: string | undefined | null): string[] {
  if (!raw) return [];
  if (raw.includes("|")) {
    return raw.split("|").map(u => u.trim()).filter(Boolean);
  }
  
  const parts = raw.split(",");
  const urls: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i].trim();
    if (part.startsWith("data:image/") && part.includes(";base64")) {
      if (i + 1 < parts.length) {
        part = part + "," + parts[i + 1].trim();
        i++;
      }
    }
    if (part) urls.push(part);
  }
  return urls;
}

export function joinScreenshots(urls: string[]): string {
  return urls.join(" | ");
}
