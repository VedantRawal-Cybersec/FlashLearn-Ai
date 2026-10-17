// XP, levels, badges, streaks, daily quests — pure helpers over the player store.
export const XP = {
  quizCorrect: 25,
  flashcardReview: 10,
  roadmapStep: 20,
  battleWin: 150,
  battleLoss: 50,
  badgeClaim: 100,
} as const;

export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
export const xpForLevel = (level: number) => (level - 1) ** 2 * 100;

export interface BadgeDef { id: string; name: string; desc: string; icon: string }
export const badges: BadgeDef[] = [
  { id: "first-blood", name: "First Blood", desc: "Win your first arena duel", icon: "⚔️" },
  { id: "scholar", name: "Scholar", desc: "Answer 25 quiz questions correctly", icon: "📜" },
  { id: "card-master", name: "Card Master", desc: "Review 30 flashcards", icon: "🃏" },
  { id: "pathfinder", name: "Pathfinder", desc: "Complete 10 roadmap steps", icon: "🗺️" },
  { id: "on-fire", name: "On Fire", desc: "Reach a 3-day streak", icon: "🔥" },
  { id: "veteran", name: "Arena Veteran", desc: "Fight 5 duels", icon: "🛡️" },
  { id: "level-5", name: "Rising Legend", desc: "Reach level 5", icon: "⭐" },
  { id: "xp-1000", name: "XP Hoarder", desc: "Earn 1000 total XP", icon: "💰" },
];

export interface DailyQuest { id: string; label: string; target: number; stat: "quiz" | "cards" | "wins" }
export const dailyQuests: DailyQuest[] = [
  { id: "dq-quiz", label: "Answer 5 quiz questions correctly", target: 5, stat: "quiz" },
  { id: "dq-cards", label: "Review 5 flashcards", target: 5, stat: "cards" },
  { id: "dq-duel", label: "Win 1 arena duel", target: 1, stat: "wins" },
];

export const todayKey = () => new Date().toISOString().slice(0, 10);
export const weekKey = () => {
  const d = new Date();
  const day = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
};

// Simulated weekly rivals for the leaderboard (deterministic per week).
const rivalNames = ["PixelPro", "QuizQueen", "NerdNinja", "ByteBandit", "StudySage"];
export function weeklyRivals(week: string) {
  let seed = [...week].reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return rivalNames.map((name) => ({ name, xp: Math.floor(200 + rand() * 800) }));
}
