import { create } from "zustand";
import { persist } from "zustand/middleware";
import { badges, dailyQuests, levelFromXp, todayKey, weekKey, XP } from "@/lib/gamification";

export const avatarColors = ["pixel-blue", "pixel-pink", "pixel-green", "pixel-purple", "pixel-gold"] as const;
export type AvatarColor = typeof avatarColors[number];
export type AvatarClass = "knight" | "mage" | "ranger";
export interface PlayerAvatar { name: string; color: AvatarColor; role: AvatarClass; accessory: "crown" | "headband" | "none" }
export const defaultAvatar: PlayerAvatar = { name: "Player One", color: "pixel-blue", role: "knight", accessory: "none" };

export type Stat = "quiz" | "cards" | "wins" | "steps";
interface PlayerState {
  avatar: PlayerAvatar;
  wins: number;
  battles: number;
  xp: number;
  stats: Record<Stat, number>;
  streak: { lastActive: string; days: number };
  claimedBadges: string[];
  questDate: string;
  questProgress: Record<string, number>;
  weekKey: string;
  weeklyXp: number;
  saveAvatar: (avatar: PlayerAvatar) => void;
  recordBattle: (won: boolean) => void;
  awardXp: (amount: number, stat?: Stat) => void;
  claimBadge: (id: string) => void;
}

const touchStreak = (s: { lastActive: string; days: number }) => {
  const today = todayKey();
  if (s.lastActive === today) return s;
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  return { lastActive: today, days: s.lastActive === yesterday ? s.days + 1 : 1 };
};

export const earnedBadges = (s: Pick<PlayerState, "xp" | "stats" | "streak" | "battles" | "wins">) =>
  badges.filter((b) => {
    switch (b.id) {
      case "first-blood": return s.wins >= 1;
      case "scholar": return s.stats.quiz >= 25;
      case "card-master": return s.stats.cards >= 30;
      case "pathfinder": return s.stats.steps >= 10;
      case "on-fire": return s.streak.days >= 3;
      case "veteran": return s.battles >= 5;
      case "level-5": return levelFromXp(s.xp) >= 5;
      case "xp-1000": return s.xp >= 1000;
      default: return false;
    }
  });

export const usePlayer = create<PlayerState>()(persist((set) => ({
  avatar: defaultAvatar, wins: 0, battles: 0, xp: 0,
  stats: { quiz: 0, cards: 0, wins: 0, steps: 0 },
  streak: { lastActive: "", days: 0 },
  claimedBadges: [],
  questDate: todayKey(),
  questProgress: {},
  weekKey: weekKey(),
  weeklyXp: 0,
  saveAvatar: (avatar) => set({ avatar }),
  recordBattle: (won) => set((s) => ({
    battles: s.battles + 1,
    wins: s.wins + Number(won),
    stats: { ...s.stats, wins: s.stats.wins + Number(won) },
    xp: s.xp + (won ? XP.battleWin : XP.battleLoss),
    weeklyXp: s.weekKey === weekKey() ? s.weeklyXp + (won ? XP.battleWin : XP.battleLoss) : (won ? XP.battleWin : XP.battleLoss),
    weekKey: weekKey(),
    streak: touchStreak(s.streak),
    questDate: todayKey(),
    questProgress: s.questDate === todayKey()
      ? { ...s.questProgress, "dq-duel": (s.questProgress["dq-duel"] ?? 0) + Number(won) }
      : { "dq-duel": Number(won) },
  })),
  awardXp: (amount, stat) => set((s) => {
    const today = todayKey();
    const quest = stat && dailyQuests.find((q) => q.stat === stat);
    return {
      xp: s.xp + amount,
      stats: stat ? { ...s.stats, [stat]: s.stats[stat] + 1 } : s.stats,
      weeklyXp: s.weekKey === weekKey() ? s.weeklyXp + amount : amount,
      weekKey: weekKey(),
      streak: touchStreak(s.streak),
      questDate: today,
      questProgress: quest
        ? (s.questDate === today
          ? { ...s.questProgress, [quest.id]: (s.questProgress[quest.id] ?? 0) + 1 }
          : { [quest.id]: 1 })
        : s.questProgress,
    };
  }),
  claimBadge: (id) => set((s) => s.claimedBadges.includes(id) ? s : {
    claimedBadges: [...s.claimedBadges, id],
    xp: s.xp + XP.badgeClaim,
    weeklyXp: s.weekKey === weekKey() ? s.weeklyXp + XP.badgeClaim : XP.badgeClaim,
    weekKey: weekKey(),
  }),
}), { name: "flash-learn-player-v1" }));
