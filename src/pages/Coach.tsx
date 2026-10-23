import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, CalendarDays, Target } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function Coach() {
  const sessions = useAppStore(s => s.sessions);
  const current = useAppStore(s => s.currentSession);
  const loaded = useAppStore(s => s.sessionsLoaded);
  const load = useAppStore(s => s.loadSessions);
  useEffect(() => { if (!loaded) void load(); }, [loaded, load]);
  const topics = useMemo(() => {
    const source = current ? [current, ...sessions.filter(s => s.id !== current.id)] : sessions;
    const groups = new Map<string, { attempted: number; correct: number; hard: number }>();
    const bucket = (name: string) => {
      if (!groups.has(name)) groups.set(name, { attempted: 0, correct: 0, hard: 0 });
      return groups.get(name)!;
    };
    for (const s of source) {
      const chapter = s.generation?.options.chapter || s.title;
      for (const question of s.quizQuestions) {
        const g = bucket(question.topic || chapter);
        if (question.userAnswer !== undefined) {
          g.attempted++;
          if (question.userAnswer === question.correctIndex) g.correct++;
        }
      }
      bucket(chapter).hard += s.flashcards.filter(card => card.difficulty === "hard").length;
    }
    return [...groups.entries()].map(([name, s]) => ({
      name, ...s, priority: (s.attempted - s.correct) * 3 + s.hard * 2 + (!s.attempted ? 1 : 0),
    })).sort((a,b) => b.priority-a.priority).slice(0, 12);
  }, [sessions, current]);
  const total = topics.reduce((n,t)=>n+t.attempted,0);
  const correct = topics.reduce((n,t)=>n+t.correct,0);
  return <div className="container max-w-5xl px-5 py-10 space-y-8 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <h1 className="text-3xl font-bold flex items-center gap-3"><BrainCircuit aria-hidden="true"/> Your Study Coach</h1>
      <p className="text-muted-foreground">A revision plan from your attempted questions and rated flashcards, not an unverified AI mastery estimate.</p>
    </header>
    <div className="grid sm:grid-cols-3 gap-4">
      <div className="pixel-panel p-5"><p>Questions attempted</p><strong className="text-3xl">{total}</strong></div>
      <div className="pixel-panel p-5"><p>Correct answers</p><strong className="text-3xl">{correct}</strong></div>
      <div className="pixel-panel p-5"><p>Observed accuracy</p><strong className="text-3xl">{total ? Math.round(correct/total*100)+"%" : "—"}</strong></div>
    </div>
    {!topics.length ? <div className="pixel-panel p-7">Create a study quest and answer a quiz to build your personalized plan. <Link to="/" className="text-primary underline">Start here</Link>.</div> : <>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Target/> Revision priorities</h2>
        {topics.map(t=><div key={t.name} className="pixel-panel p-5 flex justify-between gap-4 items-center">
          <div><h3 className="font-semibold">{t.name}</h3><p className="text-muted-foreground text-sm">{t.attempted} attempted · {t.hard} difficult cards</p></div>
          <span className="font-semibold">{t.attempted ? Math.round(t.correct/t.attempted*100)+"%" : "Not assessed"}</span>
        </div>)}
      </section>
      <section className="pixel-panel p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><CalendarDays/> Suggested spaced revision</h2>
        <p>Review priority concepts tomorrow, again after 3 days, then after 7 days. Repeat questions and track whether your accuracy improves.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {[1,3,7].map((days,i)=><div key={days} className="p-4 border bg-card"><strong>After {days} {days===1?"day":"days"}</strong><p className="text-sm mt-2">{topics.slice(i,i+2).map(t=>t.name).join(" • ") || "Revise your newest lesson"}</p></div>)}
        </div>
      </section>
      <div className="flex flex-wrap gap-4"><Link to="/drill" className="pixel-btn">Timed Exam Drill</Link><Link to="/flashcards" className="pixel-btn">Flashcard Review</Link></div>
    </>}
  </div>;
}
