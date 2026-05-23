import type { LfgGroup } from "../types";

export const LFG_GROUPS: LfgGroup[] = [
  {
    id: 1,
    host: "Alex",
    playstyle: "Casual",
    needMic: false,
    spots: 2,
    max: 4,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex",
  },
  {
    id: 2,
    host: "Sarah",
    playstyle: "Tryhard",
    needMic: true,
    spots: 1,
    max: 5,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
  },
  {
    id: 3,
    host: "Max",
    playstyle: "Achievement Hunter",
    needMic: true,
    spots: 3,
    max: 4,
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Max",
  },
];
