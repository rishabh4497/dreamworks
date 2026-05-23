import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  VoiceChannel,
  VoiceChannelKind,
  VoiceParticipant,
  VoiceParticipantState,
  VoiceSession,
} from "../types";

export async function listVoiceChannels(kind?: VoiceChannelKind): Promise<VoiceChannel[]> {
  const colRef = collection(getDb(), COLLECTIONS.voiceChannels);
  const snap = kind
    ? await getDocs(query(colRef, where("kind", "==", kind)))
    : await getDocs(colRef);
  const out: VoiceChannel[] = [];
  snap.forEach((d) => out.push(d.data() as VoiceChannel));
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getVoiceSession(channelId: string): Promise<VoiceSession | null> {
  const ref = doc(getDb(), COLLECTIONS.voiceSessions, channelId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as VoiceSession) : null;
}

export function subscribeToVoiceSession(
  channelId: string,
  cb: (session: VoiceSession | null) => void,
): () => void {
  const ref = doc(getDb(), COLLECTIONS.voiceSessions, channelId);
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? (snap.data() as VoiceSession) : null);
  });
}

async function writeSession(session: VoiceSession): Promise<void> {
  await setDoc(doc(getDb(), COLLECTIONS.voiceSessions, session.id), session);
}

async function ensureSession(channelId: string): Promise<VoiceSession> {
  const existing = await getVoiceSession(channelId);
  if (existing) return existing;
  const fresh: VoiceSession = {
    id: channelId,
    channelId,
    startedAt: new Date().toISOString(),
    participants: [],
  };
  await writeSession(fresh);
  return fresh;
}

export async function joinVoiceChannel(input: {
  channelId: string;
  participant: Omit<VoiceParticipant, "joinedAt" | "state">;
}): Promise<VoiceSession> {
  const session = await ensureSession(input.channelId);
  const exists = session.participants.find((p) => p.userId === input.participant.userId);
  if (exists) return session;
  const next: VoiceSession = {
    ...session,
    participants: [
      ...session.participants,
      { ...input.participant, joinedAt: new Date().toISOString(), state: "idle" },
    ],
  };
  await writeSession(next);
  return next;
}

export async function leaveVoiceChannel(input: {
  channelId: string;
  userId: string;
}): Promise<void> {
  const session = await getVoiceSession(input.channelId);
  if (!session) return;
  const next: VoiceSession = {
    ...session,
    participants: session.participants.filter((p) => p.userId !== input.userId),
  };
  await writeSession(next);
}

export async function setParticipantState(input: {
  channelId: string;
  userId: string;
  state: VoiceParticipantState;
}): Promise<void> {
  const session = await getVoiceSession(input.channelId);
  if (!session) return;
  const next: VoiceSession = {
    ...session,
    participants: session.participants.map((p) =>
      p.userId === input.userId ? { ...p, state: input.state } : p,
    ),
  };
  await writeSession(next);
}

export async function createVoiceChannel(input: Omit<VoiceChannel, "createdAt">): Promise<VoiceChannel> {
  const channel: VoiceChannel = { ...input, createdAt: new Date().toISOString() };
  await setDoc(doc(getDb(), COLLECTIONS.voiceChannels, channel.id), channel);
  return channel;
}
