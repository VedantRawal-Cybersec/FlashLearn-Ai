import { create } from "zustand";
import { persist } from "zustand/middleware";

export const avatarColors = ["pixel-blue", "pixel-pink", "pixel-green", "pixel-purple", "pixel-gold"] as const;
export type AvatarColor = typeof avatarColors[number];
export type AvatarClass = "knight" | "mage" | "ranger";
export interface PlayerAvatar { name: string; color: AvatarColor; role: AvatarClass; accessory: "crown" | "headband" | "none" }
export const defaultAvatar: PlayerAvatar = { name: "Player One", color: "pixel-blue", role: "knight", accessory: "none" };
interface PlayerState { avatar: PlayerAvatar; wins: number; battles: number; saveAvatar: (avatar: PlayerAvatar) => void; recordBattle: (won: boolean) => void }
export const usePlayer = create<PlayerState>()(persist((set) => ({
  avatar: defaultAvatar, wins: 0, battles: 0,
  saveAvatar: (avatar) => set({ avatar }),
  recordBattle: (won) => set((s) => ({ battles: s.battles + 1, wins: s.wins + Number(won) })),
}), { name: "flash-learn-player-v1" }));