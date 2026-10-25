import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Target, Lightbulb, ArrowRight } from "lucide-react";
import { useAppStore, type QuizQuestion } from "@/lib/store";
import { diagnoseError, getLearningInsights, pickRescue } from "@/lib/learning-intelligence";

export default function RescueMode() {
  const sessions=useAppStore(s=>s.sessions);
  const current=useAppStore(s=>s.currentSession);
  const record=useAppStore(s=>s.recordPracticeAttempt);
  const [params]=useSearchParams();
  const [selected,setSelected]=useState<number|null>(null);
  const [showAnswer,setShowAnswer]=useState(false);
  const source=useMemo(()=>current?[current,...sessions.filter(s=>s.id!==current.id)]:sessions,[sessions,current]);
  const insights=useMemo(()=>getLearningInsights(source),[source]);
  const topic=params.get("topic");
  const recommended=useMemo(()=>{
    const picked=pickRescue(source);
    if(!topic) return picked;
    const target=insights.find(i=>i.name.toLowerCase()===topic.toLowerCase());
    if(!target) return picked;
    const ids=new Set(target.mistakes.map(m=>m.questionId));
    for(const s of source){const q=s.quizQuestions.find(q=>ids.has(q.id));if(q)return {concept:target,sessionId:s.id,questionId:q.id};}
    return picked;
  },[source,insights,topic]);
  const session=source.find(s=>s.id===recommended?.sessionId);
  const question=session?.quizQuestions.find(q=>q.id===recommended?.questionId);
  const hints=diagnoseError(question?.questionType);
  const submit=()=>{
    if(!question||selected===null)return;
    const attempt:QuizQuestion={...question,userAnswer:selected};
    record([attempt]);
    setShowAnswer(true);
  };
  return <main className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3"><p className="pixel-text text-xs text-primary">TARGETED LEARNING</p>
      <h1 className="text-3xl font-bold flex items-center gap-2"><Target/> Rescue Mode</h1>
      <p className="text-muted-foreground">Revisit a real missed question, reconstruct your reasoning, then schedule a delayed review. No invented diagnosis or unverified AI hints.</p>
    </header>
    {!question?<div className="pixel-panel p-7 space-y-4">
      <h2 className="text-xl font-bold">No recorded mistakes yet</h2>
      <p>First finish a quiz or timed drill. Once an incorrect response is recorded, Rescue Mode will select a concept that needs attention.</p>
      <Link to="/" className="pixel-btn inline-block">Try a sample quest</Link>
    </div>:<section className="pixel-panel p-6 space-y-5">
      <div className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{recommended?.concept.name}</span><span className="text-sm text-muted-foreground">Based on saved mistakes</span></div>
      <h2 className="text-lg font-medium">{question.question}</h2>
      <div className="space-y-2"><h3 className="font-semibold flex items-center gap-2"><Lightbulb size={18}/> Think before answering</h3>
        <ol className="text-sm text-muted-foreground list-decimal ml-5 space-y-1">{hints.map((h,i)=><li key={i}>{h}</li>)}</ol>
      </div>
      <div className="grid gap-2">{question.options.map((o,i)=><button key={i} type="button" disabled={showAnswer} aria-pressed={selected===i}
        className={"rounded-lg p-3 text-left border "+(selected===i?"border-primary bg-primary/10":"bg-card hover:bg-accent")}
        onClick={()=>setSelected(i)}>{String.fromCharCode(65+i)}. {o}</button>)}</div>
      {!showAnswer?<button className="pixel-btn" disabled={selected===null} onClick={submit}>Check my reasoning</button>:<div role="status" className="space-y-3 bg-card border rounded-lg p-4">
        <p className="font-bold">{selected===question.correctIndex?"Correct on this retry.":"Still needs practice."}</p>
        <p>Expected answer: {question.options[question.correctIndex]}</p><p>{question.explanation || "Check a trusted textbook or teacher before relying on this answer."}</p>
        <p className="text-sm text-muted-foreground">This revisits an earlier question. Improvement on the same question is not proof of transfer to a new problem.</p>
        <div className="flex gap-3 flex-wrap"><Link to="/review" className="pixel-btn">Review flashcards</Link><Link to="/planner" className="pixel-btn">Schedule revision</Link></div>
      </div>}
    </section>}
    <Link to="/brain" className="text-primary underline inline-flex gap-1 items-center">Back to Knowledge DNA <ArrowRight size={16}/></Link>
  </main>;
}
