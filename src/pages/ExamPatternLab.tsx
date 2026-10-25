import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore, type QuizQuestion } from "@/lib/store";
import { createSampleSession } from "@/lib/demo-session";
import { EXAM_SPECS, ORIGINAL_NUMERICAL_ITEMS, gradePractice, type ExamCode, type PracticeItem } from "@/lib/exam-specifications";

export function getPatternPractice(exam: "jee-main"|"neet"): PracticeItem[] {
  const questions = createSampleSession(exam,"exam-pattern").quizQuestions.map(q => ({
    id:q.id, prompt:q.question, type:"mcq" as const, options:q.options,
    correctIndex:q.correctIndex, topic:q.topic||"General", explanation:q.explanation||"",
    provenance:"original-demonstration" as const,
  }));
  return exam==="jee-main" ? [...questions,...ORIGINAL_NUMERICAL_ITEMS] : questions;
}
export default function ExamPatternLab() {
  const [exam,setExam]=useState<ExamCode>("jee-main");
  const [phase,setPhase]=useState<"intro"|"active"|"results">("intro");
  const [position,setPosition]=useState(0);
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [flagged,setFlagged]=useState<string[]>([]);
  const [seconds,setSeconds]=useState(0);
  const saved=useRef(false);
  const current=useAppStore(s=>s.currentSession);
  const record=useAppStore(s=>s.recordPracticeAttempt);
  const spec=EXAM_SPECS[exam];
  const items=useMemo(()=>exam==="jee-advanced"?[]:getPatternPractice(exam),[exam]);
  const question=items[position];
  const mark=gradePractice(items,answers);
  const minutes=exam==="jee-main"?12:8;
  const change=(e:ExamCode)=>{setExam(e);setPhase("intro");setPosition(0);setAnswers({})};
  const start=()=>{saved.current=false;setSeconds(minutes*60);setAnswers({});setFlagged([]);setPosition(0);setPhase("active")};
  const finish=()=>{
    if(saved.current)return;
    saved.current=true;
    if(current)record(items.filter(q=>q.type==="mcq").map(q=>({
      id:q.id, question:q.prompt, topic:q.topic, options:q.options||[],
      correctIndex:q.correctIndex??0, explanation:q.explanation, questionType:"conceptual",
      userAnswer:answers[q.id]===undefined?undefined:Number(answers[q.id]),
    } as QuizQuestion)));
    setPhase("results");
  };
  useEffect(()=>{if(phase!=="active")return;const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t)},[phase]);
  useEffect(()=>{if(phase==="active"&&seconds===0)finish()},[phase,seconds]);
  return <main className="container max-w-4xl px-5 py-9 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-2">
      <p className="pixel-text text-xs text-primary">EXAM STRATEGY</p>
      <h1 className="text-3xl font-bold">Exam Pattern Lab</h1>
      <p className="text-muted-foreground">Official exam structures, followed by small original practice sets. Not a full-length authentic paper, past-year bank, or rank estimator.</p>
    </header>
    <section className="pixel-panel p-5 space-y-4">
      <div className="flex gap-2 flex-wrap">{(["jee-main","neet","jee-advanced"] as const).map(id=><button
        key={id} className={"border p-3 rounded "+(exam===id?"border-primary bg-primary/20":"bg-card")}
        aria-pressed={exam===id} onClick={()=>change(id)}>{EXAM_SPECS[id].name}</button>)}</div>
      <h2 className="text-xl font-bold">{spec.name} · 2026 reference</h2>
      <p className="text-sm">{spec.caution}</p>
      <p className="text-sm">Official format: {spec.totalQuestions??"Paper-dependent"} questions · {spec.durationMinutes} minutes {exam==="jee-advanced"?"across two papers":""} · {spec.subjects.join(", ")}</p>
      <a className="text-primary underline text-sm" href={spec.officialUrl} target="_blank" rel="noreferrer">Read official bulletin</a>
    </section>
    {exam==="jee-advanced"?<section className="pixel-panel p-6 space-y-2">
      <h2 className="font-bold text-xl">Paper-specific format unavailable</h2>
      <p>JEE Advanced marks and question types vary by paper. We will not misrepresent a fixed generic MCQ set as an authentic Advanced paper. Refer to official instructions.</p>
    </section>:phase==="intro"?<section className="pixel-panel p-6 space-y-4">
      <h2 className="text-xl font-bold">Mini practice · {items.length} questions</h2>
      <p>{exam==="jee-main"?"Includes 5 original MCQs and 3 integer-entry numericals.":"Includes 5 original Biology MCQs."}</p>
      <p className="text-sm text-muted-foreground">Timer: {minutes} minutes · simplified +4 / −1 / 0 scoring.</p>
      <button className="pixel-btn" onClick={start}>Begin mini practice</button>
    </section>:phase==="active"&&question?<section className="pixel-panel p-6 space-y-5">
      <div className="flex justify-between"><strong>{position+1} / {items.length}</strong><span role="timer">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</span></div>
      <div aria-label="Question palette" className="flex flex-wrap gap-2">{items.map((q,i)=><button
        key={q.id} aria-label={"Go to question "+(i+1)} onClick={()=>setPosition(i)}
        className={"w-10 h-10 border rounded "+(position===i?"border-primary ring-2 ring-primary":answers[q.id]!==undefined?"bg-primary/20":"bg-card")}>{i+1}{flagged.includes(q.id)?"*":""}</button>)}</div>
      <div className="flex items-center justify-between"><p className="text-sm text-primary">{question.topic} · {question.type==="integer"?"Integer answer":"Single-correct MCQ"}</p>
        <button className="text-primary underline text-sm" onClick={()=>setFlagged(s=>s.includes(question.id)?s.filter(x=>x!==question.id):[...s,question.id])}>Mark for review</button></div>
      <h2 className="font-semibold text-lg">{question.prompt}</h2>
      {question.type==="integer"?<label className="space-y-2 block">Enter an integer (without units)
        <input aria-label="Integer answer" type="number" step="1" inputMode="numeric" className="w-full p-3 border bg-background rounded"
          value={answers[question.id]??""} onChange={e=>setAnswers(a=>({...a,[question.id]:e.target.value}))}/></label>:
        <div className="grid gap-2">{question.options?.map((opt,i)=><button
          key={i} aria-pressed={answers[question.id]===String(i)} className={"text-left p-3 border rounded "+(answers[question.id]===String(i)?"border-primary bg-primary/20":"bg-card")}
          onClick={()=>setAnswers(a=>({...a,[question.id]:String(i)}))}>{String.fromCharCode(65+i)}. {opt}</button>)}</div>}
      <div className="flex gap-3 justify-between"><button className="pixel-btn" disabled={position===0} onClick={()=>setPosition(i=>i-1)}>Previous</button>
        <button className="pixel-btn" onClick={()=>position===items.length-1?finish():setPosition(i=>i+1)}>{position===items.length-1?"Finish practice":"Next"}</button></div>
      <button className="text-primary underline" onClick={finish}>Submit early</button>
    </section>:<div className="space-y-4">
      <section className="pixel-panel p-6 text-center space-y-2">
        <h2 className="text-2xl font-bold">Mini practice results</h2><p className="text-3xl font-bold">{mark.points} / {mark.maxPoints}</p>
        <p>{mark.correct} correct · {mark.wrong} wrong · {mark.skipped} skipped</p>
        <p className="text-sm text-muted-foreground">{current?"MCQ answers saved in your local attempt history; numerical results are displayed here only.":"Start a study session first to preserve MCQ attempt history."}</p>
      </section>
      {items.map((q,i)=><article key={q.id} className="pixel-panel p-5 space-y-2">
        <h3 className="font-semibold">{i+1}. {q.prompt}</h3>
        <p>Your answer: {answers[q.id]===undefined||answers[q.id]===""?"Skipped":q.type==="integer"?answers[q.id]:q.options?.[Number(answers[q.id])]}</p>
        <p>Expected: {q.type==="integer"?q.answerInteger:q.options?.[q.correctIndex??0]}</p>
        <p className="text-sm text-muted-foreground">{q.explanation}</p>
      </article>)}
      <button className="pixel-btn" onClick={start}>Try again</button><Link className="text-primary underline ml-4" to="/brain">Exam Brain</Link>
    </div>}
  </main>;
}
