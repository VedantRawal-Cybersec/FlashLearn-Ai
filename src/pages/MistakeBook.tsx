import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import type { WrongAnswer } from "@/lib/quiz-history";

export default function MistakeBook() {
  const sessions = useAppStore(s => s.sessions);
  const current = useAppStore(s => s.currentSession);
  const attempts = useMemo(() => {
    const source = current ? [current, ...sessions.filter(s => s.id !== current.id)] : sessions;
    return source.flatMap(session => (session.quizAttempts || []).map(attempt => ({ session: session.title, ...attempt })))
      .sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  }, [current, sessions]);
  const unique = new Map<string, { item: WrongAnswer; session: string; completedAt: string }>();
  for (const attempt of attempts) for (const item of attempt.mistakes) {
    if (!unique.has(item.questionId)) unique.set(item.questionId, { item, session: attempt.session, completedAt: attempt.completedAt });
  }
  const misses = [...unique.values()];
  return <div className="container max-w-4xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <h1 className="text-3xl font-bold">Mistake Book</h1>
      <p className="text-muted-foreground">See questions you missed or skipped in past attempts. Use their explanations and your source materials to understand the errors. Not an independently verified answer key.</p>
      <p className="font-semibold">{misses.length} distinct questions to revisit · {attempts.length} saved attempts</p>
    </header>
    {misses.length === 0 ? <div className="pixel-panel p-6">No recorded mistakes yet. Complete a quiz or timed drill to begin. <Link to="/quiz" className="text-primary underline">Try quiz</Link></div> : <>
      {misses.map(({item,session,completedAt})=><article key={item.questionId} className="pixel-panel p-5 space-y-2">
        <p className="text-sm text-muted-foreground">{session} · {item.topic} · {new Date(completedAt).toLocaleDateString()}</p>
        <h2 className="font-semibold">{item.question}</h2>
        <p className="text-sm">Your answer: {item.selected ?? "Skipped"}</p>
        <p className="text-sm">Expected answer: <strong>{item.correct}</strong></p>
        <p className="bg-card p-3 border text-sm">{item.explanation}</p>
      </article>)}
      <div className="flex flex-wrap gap-3"><Link to="/review" className="pixel-btn">Review due flashcards</Link><Link to="/coach" className="pixel-btn">Back to Study Coach</Link></div>
    </>}
  </div>;
}
