import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Timer, Trophy } from "lucide-react";
import { useAppStore } from "@/lib/store";

type Phase = "intro" | "active" | "results";
export default function ExamDrill() {
  const session = useAppStore(s => s.currentSession);
  const questions = session?.quizQuestions ?? [];
  const submitAnswers = useAppStore(s => s.submitQuizAnswers);
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [left, setLeft] = useState(0);
  const exam = session?.generation?.options.examLevel || "standard";
  const weighted = ["jee-main", "jee-advanced", "neet"].includes(exam);
  const positive = weighted ? 4 : 1;
  const negative = weighted ? -1 : 0;
  const minutes = Math.max(5, Math.round(questions.length * 1.5));
  const start = () => { setAnswers({}); setIndex(0); setLeft(minutes * 60); setPhase("active"); };
  const finish = () => { submitAnswers(answers); setPhase("results"); };
  useEffect(() => {
    if (phase !== "active") return;
    const timer = window.setInterval(() => setLeft(s=>Math.max(0,s-1)),1000);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase === "active" && left === 0) finish();
  }, [phase, left]);
  const correct = questions.filter(q => answers[q.id] === q.correctIndex).length;
  const attempted = questions.filter(q => answers[q.id] !== undefined).length;
  const wrong = attempted - correct;
  const marks = positive*correct + negative*wrong;
  const question = questions[index];
  if (!session || !questions.length) return <div className="container py-20 text-center"><p>Create a study session before entering Exam Drill.</p><Link to="/" className="text-primary underline">Start learning</Link></div>;
  return <div className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
    <header><p className="pixel-text text-primary text-xs mb-3">SINGLE-CORRECT QUESTION PRACTICE</p><h1 className="text-3xl font-bold">Timed Exam Drill</h1><p className="text-muted-foreground">{session.title} · {questions.length} questions</p></header>
    {phase === "intro" && <div className="pixel-panel p-7 space-y-4">
      <p className="flex gap-2 items-center"><Timer/>{minutes}-minute timer, answers revealed after submission.</p>
      <p>Uses your existing original AI-generated questions. This is not an official examination or a full-format mock test.</p>
      <p className="text-sm text-muted-foreground">Simulated marking: +{positive} correct, {negative} wrong, 0 skipped. Official patterns and marking may vary by exam/year.</p>
      <button onClick={start} className="pixel-btn">Start drill</button>
    </div>}
    {phase === "active" && <div className="pixel-panel p-6 space-y-5">
      <div className="flex justify-between"><strong>Question {index+1}/{questions.length}</strong><span role="timer" className="font-bold">{Math.floor(left/60).toString().padStart(2,"0")}:{(left%60).toString().padStart(2,"0")}</span></div>
      <h2 className="text-lg">{question.question}</h2>
      <div className="grid gap-3">{question.options.map((opt,i)=><button key={i} aria-pressed={answers[question.id]===i} onClick={()=>setAnswers(s=>({...s,[question.id]:i}))} className={"p-4 text-left border bg-card transition-colors "+(answers[question.id]===i?"border-primary bg-primary/20":"hover:bg-accent")}>{String.fromCharCode(65+i)}. {opt}</button>)}</div>
      <div className="flex justify-between gap-3"><button onClick={()=>setIndex(i=>Math.max(0,i-1))} disabled={index===0} className="pixel-btn">Previous</button>{index<questions.length-1?<button onClick={()=>setIndex(i=>i+1)} className="pixel-btn">Next</button>:<button onClick={finish} className="pixel-btn">Submit</button>}</div>
      <button onClick={finish} className="text-primary underline text-sm">Finish and grade answers</button>
    </div>}
    {phase === "results" && <div className="space-y-5">
      <div className="pixel-panel p-7 text-center"><Trophy className="mx-auto text-primary"/><h2 className="text-2xl">Drill Results</h2><p className="text-3xl font-bold">{marks} / {positive*questions.length}</p><p>{correct} correct · {wrong} incorrect · {questions.length-attempted} skipped</p><p className="text-sm mt-3">Simulated MCQ scoring, not an official rank prediction.</p></div>
      {questions.map((q,i)=><div key={q.id} className="pixel-panel p-5 space-y-2"><p>{i+1}. {q.question}</p><p className="text-sm">Your answer: {answers[q.id]===undefined?"Skipped":q.options[answers[q.id]]}</p><p className="text-sm">Correct: {q.options[q.correctIndex]}</p><p className="text-sm text-muted-foreground">{q.explanation}</p></div>)}
      <div className="flex gap-4"><button onClick={start} className="pixel-btn">Retry</button><Link to="/coach" className="self-center text-primary underline">View Study Coach</Link></div>
    </div>}
  </div>;
}
