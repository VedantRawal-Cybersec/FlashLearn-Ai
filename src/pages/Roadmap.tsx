import { useAppStore } from "@/lib/store";
import { usePlayer } from "@/lib/player";
import { XP } from "@/lib/gamification";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Roadmap() {
  const session = useAppStore((s) => s.currentSession);
  const toggleItem = useAppStore((s) => s.toggleRoadmapItem);
  const awardXp = usePlayer((s) => s.awardXp);

  if (!session || session.roadmap.length === 0) {
    return (
      <div className="container max-w-3xl py-20 text-center animate-fade-in">
        <p className="text-muted-foreground">No roadmap available. Generate a study session first.</p>
      </div>
    );
  }

  const completed = session.roadmap.filter((r) => r.completed).length;

  return (
    <div className="container max-w-2xl py-10 px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Learning Roadmap</h1>
        <span className="text-sm text-muted-foreground font-medium">
          {completed}/{session.roadmap.length} done
        </span>
      </div>

      <div className="h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(completed / session.roadmap.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {session.roadmap.map((item, i) => (
          <button
            key={item.id}
            onClick={() => { if (!item.completed) awardXp(XP.roadmapStep, "steps"); toggleItem(item.id); }}
            className={cn(
              "w-full text-left rounded-xl border bg-card p-4 flex items-start gap-3 transition-all duration-200 hover-lift opacity-0 animate-fade-in-up",
              `stagger-${Math.min(i + 1, 8)}`,
              item.completed && "border-success/40 bg-success/5"
            )}
          >
            <div className={cn("transition-transform duration-300", item.completed && "scale-110")}>
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
            </div>
            <div>
              <p className={cn(
                "font-medium text-sm transition-all duration-200",
                item.completed ? "text-muted-foreground line-through" : "text-foreground"
              )}>
                {i + 1}. {item.title}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
