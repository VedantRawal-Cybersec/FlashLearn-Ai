import { usePlayer, earnedBadges } from "@/lib/player";
import { badges, dailyQuests, levelFromXp, xpForLevel, weeklyRivals, weekKey } from "@/lib/gamification";
import PlayerAvatar from "@/components/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Rewards() {
  const player = usePlayer();
  const level = levelFromXp(player.xp);
  const intoLevel = player.xp - xpForLevel(level);
  const levelSpan = xpForLevel(level + 1) - xpForLevel(level);
  const earned = earnedBadges(player);
  const board = [...weeklyRivals(weekKey()), { name: player.avatar.name, xp: player.weeklyXp, you: true }]
    .sort((a, b) => b.xp - a.xp);

  return (
    <div className="container max-w-4xl px-5 py-8 animate-fade-in">
      <p className="pixel-text text-primary text-[0.6rem] mb-3">XP · BADGES · QUESTS</p>
      <h1 className="mb-8">Rewards hall</h1>

      {/* Level + streak */}
      <div className="pixel-panel p-6 mb-8 flex flex-wrap items-center gap-6">
        <PlayerAvatar avatar={player.avatar} size={90} className="avatar-idle" />
        <div className="flex-1 min-w-[220px]">
          <div className="flex justify-between items-baseline mb-2">
            <span className="pixel-text text-[0.65rem] text-ink">LVL {level} · {player.avatar.name}</span>
            <span className="text-sm text-ink/70">{intoLevel}/{levelSpan} XP</span>
          </div>
          <div className="h-4 border-2 border-ink bg-cream-deep overflow-hidden">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, (intoLevel / levelSpan) * 100)}%` }} />
          </div>
          <p className="text-sm text-ink/70 mt-2">{player.xp} total XP · {player.wins}/{player.battles} duels won</p>
        </div>
        <div className="text-center">
          <Flame className={cn("h-9 w-9 mx-auto", player.streak.days > 0 ? "text-destructive" : "text-ink/30")} />
          <p className="pixel-text text-[0.6rem] text-ink mt-2">{player.streak.days} DAY<br />STREAK</p>
        </div>
      </div>

      {/* Daily quests */}
      <h2 className="mb-4 flex items-center gap-2"><Sparkles className="text-primary" /> Daily quests</h2>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {dailyQuests.map((q) => {
          const done = Math.min(player.questProgress[q.id] ?? 0, q.target);
          const complete = done >= q.target;
          return (
            <div key={q.id} className={cn("pixel-panel p-4", complete && "outline outline-2 outline-success")}>
              <p className="text-ink font-medium text-sm mb-3">{q.label}</p>
              <div className="h-3 border-2 border-ink bg-cream-deep overflow-hidden mb-2">
                <div className={cn("h-full transition-all duration-500", complete ? "bg-success" : "bg-primary")} style={{ width: `${(done / q.target) * 100}%` }} />
              </div>
              <p className="text-xs text-ink/70">{complete ? "✅ Complete!" : `${done}/${q.target}`}</p>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <h2 className="mb-4 flex items-center gap-2"><Trophy className="text-primary" /> Trophy cabinet</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {badges.map((b) => {
          const isEarned = earned.some((e) => e.id === b.id);
          const isClaimed = player.claimedBadges.includes(b.id);
          return (
            <div key={b.id} className={cn("pixel-panel p-4 text-center transition-all", !isEarned && "opacity-50 grayscale")}>
              <span className="text-4xl block mb-2" aria-hidden>{b.icon}</span>
              <p className="pixel-text text-[0.55rem] text-ink mb-1">{b.name}</p>
              <p className="text-xs text-ink/70 mb-3">{b.desc}</p>
              {isClaimed ? (
                <span className="text-xs text-success font-semibold">Claimed ✓</span>
              ) : isEarned ? (
                <Button size="sm" variant="pixel" className="w-full" onClick={() => player.claimBadge(b.id)}>Claim +100 XP</Button>
              ) : (
                <span className="text-xs text-ink/50">Locked</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly leaderboard */}
      <h2 className="mb-4 flex items-center gap-2"><Crown className="text-primary" /> Weekly leaderboard</h2>
      <div className="pixel-panel p-4">
        {board.map((r, i) => (
          <div key={r.name} className={cn("flex items-center gap-3 px-3 py-2.5", r.you && "bg-primary/15 border-2 border-primary")}>
            <span className="pixel-text text-[0.6rem] w-8 text-ink">{["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`}</span>
            <span className={cn("flex-1 font-medium", r.you ? "text-ink" : "text-ink/80")}>{r.name}{r.you && " (you)"}</span>
            <span className="pixel-text text-[0.6rem] text-primary">{r.xp} XP</span>
          </div>
        ))}
        <p className="text-xs text-ink/60 mt-3 px-3">Rivals are simulated adventurers — your XP is real. Resets every Monday.</p>
      </div>
    </div>
  );
}
