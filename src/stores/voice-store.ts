import { create } from "zustand";
import {
  joinVoiceChannel,
  leaveVoiceChannel,
  setParticipantState,
  subscribeToVoiceSession,
} from "@/lib/api/voice";
import type { VoiceParticipantState, VoiceSession } from "@/lib/types";
import { useAuthStore } from "./auth-store";

interface VoiceStore {
  /** Channel id the user is currently connected to, or null. */
  activeChannelId: string | null;
  /** Most recent session snapshot from Firestore. */
  session: VoiceSession | null;
  muted: boolean;
  deafened: boolean;
  /** Active onSnapshot unsubscribe handle. */
  _unsubscribe: (() => void) | null;
  join: (channelId: string) => Promise<void>;
  leave: () => Promise<void>;
  toggleMute: () => Promise<void>;
  toggleDeafen: () => Promise<void>;
}

function localState(muted: boolean, deafened: boolean): VoiceParticipantState {
  if (deafened) return "deafened";
  if (muted) return "muted";
  return "idle";
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  activeChannelId: null,
  session: null,
  muted: false,
  deafened: false,
  _unsubscribe: null,

  join: async (channelId) => {
    const profile = useAuthStore.getState().profile;
    if (!profile?.uid) return;

    // If already in a different channel, leave it first.
    const current = get().activeChannelId;
    if (current && current !== channelId) {
      await get().leave();
    }

    await joinVoiceChannel({
      channelId,
      participant: {
        userId: profile.uid,
        displayName: profile.displayName ?? "Player",
        avatarUrl: profile.avatarUrl ?? "",
      },
    });

    const unsub = subscribeToVoiceSession(channelId, (session) => {
      set({ session });
    });

    set({ activeChannelId: channelId, _unsubscribe: unsub });
  },

  leave: async () => {
    const { activeChannelId, _unsubscribe } = get();
    const profile = useAuthStore.getState().profile;
    if (_unsubscribe) _unsubscribe();
    if (activeChannelId && profile?.uid) {
      await leaveVoiceChannel({ channelId: activeChannelId, userId: profile.uid });
    }
    set({
      activeChannelId: null,
      session: null,
      _unsubscribe: null,
      muted: false,
      deafened: false,
    });
  },

  toggleMute: async () => {
    const { activeChannelId, muted, deafened } = get();
    const profile = useAuthStore.getState().profile;
    const nextMuted = !muted;
    set({ muted: nextMuted });
    if (activeChannelId && profile?.uid) {
      await setParticipantState({
        channelId: activeChannelId,
        userId: profile.uid,
        state: localState(nextMuted, deafened),
      });
    }
  },

  toggleDeafen: async () => {
    const { activeChannelId, muted, deafened } = get();
    const profile = useAuthStore.getState().profile;
    const nextDeafened = !deafened;
    // Deafening implicitly mutes.
    const nextMuted = nextDeafened ? true : muted;
    set({ muted: nextMuted, deafened: nextDeafened });
    if (activeChannelId && profile?.uid) {
      await setParticipantState({
        channelId: activeChannelId,
        userId: profile.uid,
        state: localState(nextMuted, nextDeafened),
      });
    }
  },
}));

useAuthStore.subscribe((state) => {
  if (!state.profile?.uid) {
    const s = useVoiceStore.getState();
    if (s._unsubscribe) s._unsubscribe();
    useVoiceStore.setState({
      activeChannelId: null,
      session: null,
      muted: false,
      deafened: false,
      _unsubscribe: null,
    });
  }
});
