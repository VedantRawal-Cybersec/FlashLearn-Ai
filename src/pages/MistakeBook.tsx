import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "@/lib/store";
import type { WrongAnswer } from "@/lib/quiz-history";

export default function MistakeBook() {
  const sessions = useAppStore(s => s.sessions);
  const current = useAppStore(s => s.currentSession);
  const report = useAppStore(s=>s.reportQuestion);
  const [drafts,setDrafts]=useState<Record<string,string>>({});
  const [saved,setSaved]=useState<string[]>([]);
  const attempts = useMemo(() => {
    const source = current ? [current, ...sessions.filter(s => s.id !== current.id)] : sessions;
    return source.flatMap(session => (session.quizAttempts || []).map(attempt => ({ session: session.title, sessionId: session.id, ...attempt })))
      .sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
  }, [current, sessions]);
  const unique = new Map<string, { item: WrongAnswer; session: string; sessionId: string; completedAt: string }>();
  for (const attempt of attempts) for (const item of attempt.mistakes) {
    if (!unique.has(item.questionId)) unique.set(item.questionId, { item, session: attempt.session, sessionId: attempt.sessionId, completedAt: attempt.completedAt });
  }
  const misses = [...unique.values()];
  return <div className="container max-w-4xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <h1 className="text-3xl font-bold">Mistake Book</h1>
      <p className="text-muted-foreground">See questions you missed or skipped in past attempts. Use their explanations and your source materials to understand the errors. Not an independently verified answer key.</p>
      <p className="font-semibold">{misses.length} distinct questions to revisit · {attempts.length} saved attempts</p>
    </header>
    {misses.length === 0 ? <div className="pixel-panel p-6">No recorded mistakes yet. Complete a quiz or timed drill to begin. <Link to="/quiz" className="text-primary underline">Try quiz</Link></div> : <>
      {misses.map(({item,session,sessionId,completedAt})=><article key={item.questionId} className="pixel-panel p-5 space-y-2">
        <p className="text-sm text-muted-foreground">{session} · {item.topic} · {new Date(completedAt).toLocaleDateString()}</p>
        <h2 className="font-semibold">{item.question}</h2>
        <p className="text-sm">Your answer: {item.selected ?? "Skipped"}</p>
        <p className="text-sm">Expected answer: <strong>{item.correct}</strong></p>
        <p className="bg-card p-3 border text-sm">{item.explanation}</p>
        <details className="border p-3 rounded">
          <summary className="text-primary cursor-pointer text-sm">Report an incorrect or unclear answer</summary>
          <label className="block text-sm mt-2">Explain the issue (saved only on your device)
            <textarea aria-label={"Report issue with "+item.question} maxLength={500} className="w-full border p-2 rounded bg-background mt-1"
              value={drafts[item.questionId]||""} onChange={e=>setDrafts(d=>({...d,[item.questionId]:e.target.value}))}/>
          </label>
          <button className="pixel-btn mt-2" disabled={!drafts[item.questionId]||drafts[item.questionId].trim().length<5} onClick={()=>{
            if(report(sessionId,item.questionId,drafts[item.questionId])) setSaved(a=>[...a,item.questionId]);
          }}>Save issue locally</button>
          {saved.includes(item.questionId)&&<p className="text-sm mt-2" role="status">Issue saved on this device. It was NOT sent to a moderator.</p>}
        </details>
      </article>)}
      <div className="flex flex-wrap gap-3"><Link to="/review" className="pixel-btn">Review due flashcards</Link><Link to="/coach" className="pixel-btn">Back to Study Coach</Link></div>
    </>}
  </div>;
}
