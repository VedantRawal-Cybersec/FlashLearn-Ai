import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { isReviewDue } from "@/lib/spaced-repetition";
import { BrainCircuit, CalendarDays, Target } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function Coach() {
  const sessions = useAppStore(s => s.sessions);
  const current = useAppStore(s => s.currentSession);
  const loaded = useAppStore(s => s.sessionsLoaded);
  const load = useAppStore(s => s.loadSessions);
  const importBackupData = useAppStore(s => s.importBackupData);
  const [backupMessage, setBackupMessage] = useState("");
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
  const source = current ? [current, ...sessions.filter(s => s.id !== current.id)] : sessions;
  const dueCards = source.reduce((n,s) => n + s.flashcards.filter(c => isReviewDue(c)).length, 0);
  const history = source.flatMap(s => (s.quizAttempts || []).map(a => ({ ...a, session: s.title }))).sort((a,b) => b.completedAt.localeCompare(a.completedAt));
  const total = topics.reduce((n,t)=>n+t.attempted,0);
  const correct = topics.reduce((n,t)=>n+t.correct,0);
  const importBackup = async (file?: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024 || file.size === 0) {
      setBackupMessage("Backup must be a non-empty JSON file under 2 MB.");
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      const count = importBackupData(payload);
      setBackupMessage(count ? `Restored ${count} study sessions. Existing sessions were kept.` : "This backup has no new sessions to restore.");
    } catch (err) {
      setBackupMessage(err instanceof Error ? err.message : "This backup could not be restored.");
    }
  };
  const exportBackup = () => {
    const all = current ? [current, ...sessions.filter(s => s.id !== current.id)] : sessions;
    const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), sessions: all }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "flash-learn-study-backup.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  return <div className="container max-w-5xl px-5 py-10 space-y-8 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <h1 className="text-3xl font-bold flex items-center gap-3"><BrainCircuit aria-hidden="true"/> Your Study Coach</h1>
      <p className="text-muted-foreground">A revision plan from your attempted questions and rated flashcards, not an unverified AI mastery estimate.</p>
      <div className="space-y-2">
        <button type="button" className="pixel-btn" onClick={exportBackup}>Export my study data</button>
        <label className="inline-flex items-center gap-2 cursor-pointer text-primary underline px-3">
          Import study backup
          <input type="file" aria-label="Import study backup" accept=".json,application/json" className="sr-only" onChange={e => { void importBackup(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
        {backupMessage && <p role="status" className="text-sm font-medium">{backupMessage}</p>}
        <p className="text-sm text-muted-foreground">Your study history is stored on this browser until secure account synchronization is enabled. Keep your backup file private; it contains your learning records.</p>
      </div>
    </header>
    <div className="flex flex-wrap gap-3"><Link to="/brain" className="pixel-btn">Exam Brain</Link><Link to="/rescue" className="pixel-btn">Rescue Mission</Link><Link to="/planner" className="pixel-btn">Exam-Day Planner</Link><Link to="/pattern-lab" className="pixel-btn">Exam Pattern Lab</Link><Link to="/review" className="pixel-btn">Review due cards ({dueCards})</Link><Link to="/mistakes" className="pixel-btn">Mistake Book</Link></div>
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
      {history.length > 0 && <section className="pixel-panel p-6 space-y-3">
        <h2 className="text-xl font-semibold">Recent quiz attempts</h2>
        <p className="text-sm text-muted-foreground">Saved results are factual answer counts, not predicted exam ranks.</p>
        {history.slice(0,5).map(a => <div key={a.id} className="flex justify-between gap-3 border-t py-2"><span>{a.session} · {a.kind}</span><strong>{a.correct}/{a.total} correct</strong></div>)}
      </section>}
      <div className="flex flex-wrap gap-4"><Link to="/drill" className="pixel-btn">Timed Exam Drill</Link><Link to="/flashcards" className="pixel-btn">Flashcard Review</Link></div>
    </>}
  </div>;
}
