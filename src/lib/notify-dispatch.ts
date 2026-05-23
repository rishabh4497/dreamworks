import type { GameId, NotificationKind } from "@/lib/types";
import { useUiStore, notificationPrefEnabled } from "@/stores/ui-store";
import { useNotificationsStore } from "@/stores/notifications-store";
import { toast } from "@/stores/toast-store";
import { notify } from "@/lib/platform";

export interface DispatchOptions {
  kind: NotificationKind;
  title: string;
  body?: string;
  gameId?: GameId;
  href?: string;
  /** When true, bypass quiet hours (downloads, completed installs, …). */
  critical?: boolean;
}

function isInQuietHours(startHour: number, endHour: number): boolean {
  const now = new Date().getHours();
  if (startHour === endHour) return false;
  if (startHour < endHour) {
    return now >= startHour && now < endHour;
  }
  // Wraps midnight (e.g. 22→8): inside if now >= 22 OR now < 8
  return now >= startHour || now < endHour;
}

/**
 * Single chokepoint for every user-facing notification. Respects the user's
 * Notifications & Chat tab preferences:
 *   - `quietHours` suppresses toast + OS notify for non-critical alerts
 *   - `browserNotify` gates the OS notification call
 *   - `playNotificationSound` plays a short ping with the toast
 *   - `notificationPrefs[kind]` gates the in-app bell entry
 */
export function dispatchAppNotification(options: DispatchOptions): void {
  const { kind, title, body, gameId, href, critical } = options;
  const { settings } = useUiStore.getState();

  const muted =
    !critical &&
    settings.quietHours.enabled &&
    isInQuietHours(settings.quietHours.startHour, settings.quietHours.endHour);

  if (!muted) {
    toast.success(body ? `${title} — ${body}` : title);
    if (settings.playNotificationSound) {
      playNotificationPing();
    }
    if (settings.browserNotify && body) {
      void notify(title, body);
    } else if (settings.browserNotify) {
      void notify(title, "");
    }
  }

  if (notificationPrefEnabled(kind)) {
    void useNotificationsStore.getState().push({
      kind,
      title,
      body: body ?? "",
      gameId,
      href,
    });
  }
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Quick double-blip used for notifications. */
export function playNotificationPing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const beep = (start: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.09);
    };
    beep(now, 880);
    beep(now + 0.1, 1320);
  } catch {
    // ignore
  }
}

/** Single softer ping used when a new chat message arrives. */
export function playChatPing(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // ignore
  }
}
