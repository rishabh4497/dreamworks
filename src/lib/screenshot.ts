/**
 * Matches a keyboard event against a shortcut string like "F12", "Ctrl+Shift+S",
 * "Alt+P". The shortcut format is what the SettingsPage rebinder produces.
 */
export function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  if (!shortcut) return false;
  const parts = shortcut.split("+").map((p) => p.trim().toUpperCase());
  const key = parts[parts.length - 1];
  const needsCtrl = parts.includes("CTRL");
  const needsShift = parts.includes("SHIFT");
  const needsAlt = parts.includes("ALT");
  if (needsCtrl !== e.ctrlKey) return false;
  if (needsShift !== e.shiftKey) return false;
  if (needsAlt !== e.altKey) return false;
  return e.key.toUpperCase() === key;
}

/** True if the keyboard event originated from a text input — we skip our
 * global shortcut in that case so the rebinder (and normal typing) win. */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

/**
 * Captures the visible viewport as a PNG and triggers a download. Uses an
 * SVG <foreignObject> wrapper around a clone of <html> rasterized into a
 * canvas — works in both web and Tauri webview.
 */
export async function captureViewport(): Promise<void> {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const doctype = document.doctype
    ? `<!DOCTYPE ${document.doctype.name}>`
    : "";

  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  // Inline computed CSS variables on the cloned <html> so the SVG snapshot
  // renders with the same theme colors. The SVG sandbox can't reach the live
  // stylesheet, so without this everything renders as default-styled HTML.
  const computed = getComputedStyle(document.documentElement);
  const inlineStyles: string[] = [];
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    if (prop.startsWith("--")) {
      inlineStyles.push(`${prop}: ${computed.getPropertyValue(prop)}`);
    }
  }
  clone.setAttribute("style", inlineStyles.join(";"));

  const serializer = new XMLSerializer();
  const htmlMarkup = serializer.serializeToString(clone);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">${doctype}${htmlMarkup}</foreignObject>
  </svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to render viewport snapshot"));
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    ctx.drawImage(img, 0, 0, width, height);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png"),
    );
    if (!pngBlob) throw new Error("Canvas toBlob returned null");

    const pngUrl = URL.createObjectURL(pngBlob);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `dreamworks-${stamp}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

let audioCtx: AudioContext | null = null;

/** Short camera-shutter ding rendered with Web Audio — no asset needed. */
export function playShutterSound(): void {
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Audio failures shouldn't block the screenshot.
  }
}
