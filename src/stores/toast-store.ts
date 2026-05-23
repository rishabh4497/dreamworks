import { create } from "zustand";

export interface ToastAction {
  label: string;
  /** Fired when the user clicks the action. The toast is dismissed automatically. */
  onClick: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  /** Optional inline action (e.g. "Undo"). */
  action?: ToastAction;
  /** Milliseconds before auto-dismiss. Defaults to 3000, 5000 when there's an action. */
  durationMs?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (
    message: string,
    type?: Toast["type"],
    options?: { action?: ToastAction; durationMs?: number },
  ) => string;
  removeToast: (id: string) => void;
}

const DEFAULT_DURATION = 3000;
const ACTION_DURATION = 5000;

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (message, type = "info", options) => {
    const id = Math.random().toString(36).slice(2);
    const duration =
      options?.durationMs ?? (options?.action ? ACTION_DURATION : DEFAULT_DURATION);
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id, message, type, action: options?.action, durationMs: duration },
      ],
    }));
    setTimeout(() => {
      // Only remove if still present (action may have triggered manual removal already).
      if (get().toasts.some((t) => t.id === id)) {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }
    }, duration);
    return id;
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (msg: string, options?: { action?: ToastAction; durationMs?: number }) =>
    useToastStore.getState().addToast(msg, "success", options),
  error: (msg: string, options?: { action?: ToastAction; durationMs?: number }) =>
    useToastStore.getState().addToast(msg, "error", options),
  info: (msg: string, options?: { action?: ToastAction; durationMs?: number }) =>
    useToastStore.getState().addToast(msg, "info", options),
};
