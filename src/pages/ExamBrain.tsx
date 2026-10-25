import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Target, CalendarClock, BookOpen, ArrowRight, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getLearningInsights } from "@/lib/learning-intelligence";

export default function ExamBrain() {
  const sessions = useAppStore(s=>s.sessions);
  const current = useAppStore(s=>s.currentSession);
  const data = useMemo(()=>getLearningInsights(current ? [current,...sessions] : sessions),[sessions,current]);
  const attempts = data.reduce((n,d)=>n+d.attempted,0);
  const overdue = data.reduce((n,d)=>n+d.dueCards,0);
  return <main className="container max-w-6xl px-5 py-9 space-y-7 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <p className="pixel-text text-xs text-primary">FLASH LEARN INTELLIGENCE</p>
      <h1 className="text-3xl font-bold flex items-center gap-3"><BrainCircuit/> Exam Brain</h1>
      <p className="text-muted-foreground">Your concept map is built from saved answers, incorrect attempts, and due review cards. It never invents a mastery probability.</p>
    </header>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[[String(data.length),"Concepts observed"],[String(attempts),"Recorded answers"],[String(overdue),"Due flashcards"],[String(data.filter(x=>x.evidence==="repeated").length),"Repeated-evidence topics"]].map(([value,label])=>
        <div className="pixel-panel p-4" key={label}><strong className="text-2xl block">{value}</strong><span className="text-muted-foreground text-sm">{label}</span></div>)}
    </div>
    <section className="pixel-panel p-5 space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2"><Target/> Knowledge DNA</h2>
      <p className="text-sm text-muted-foreground">Each tile represents a topic observed in your attempts, not a completed syllabus. Gray means there is too little evidence. Your latest exam selection only helps organize future practice.</p>
      {data.length===0?<p>No learning evidence yet. <Link to="/" className="text-primary underline">Try a free sample quiz</Link>, then return after submitting answers.</p>:
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-label="Knowledge DNA concepts">
          {data.map(d=><div key={d.name} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-3"><strong className="break-words">{d.name}</strong>
              <span className="text-xs border px-2 py-1 rounded">{d.evidence==="insufficient"?"Early data":d.evidence==="emerging"?"Some evidence":"Repeated"}</span></div>
            <div className="h-2 rounded bg-muted overflow-hidden" role="img" aria-label={d.accuracy===null?"No measured answer accuracy":d.accuracy+" percent observed accuracy"}>
              {d.accuracy!==null && <div className="h-full bg-primary transition-[width]" style={{width:d.accuracy+"%"}}/>}
            </div>
            <p className="text-xs text-muted-foreground">{d.accuracy===null?"Answer accuracy unavailable":d.accuracy+"% observed correct"} · {d.attempted} answered · {d.errors} recorded errors · {d.dueCards} due</p>
            <Link className="text-primary underline text-sm inline-flex items-center gap-1" to={"/rescue?topic="+encodeURIComponent(d.name)}>Target this concept <ArrowRight size={14}/></Link>
          </div>)}
        </div>}
    </section>
    <div className="grid md:grid-cols-3 gap-3">
      <Link className="pixel-panel p-5 hover:border-primary flex items-center gap-3" to="/rescue"><Target/> Rescue Mission <ArrowRight className="ml-auto" size={16}/></Link>
      <Link className="pixel-panel p-5 hover:border-primary flex items-center gap-3" to="/planner"><CalendarClock/> Exam-Day Planner <ArrowRight className="ml-auto" size={16}/></Link>
      <Link className="pixel-panel p-5 hover:border-primary flex items-center gap-3" to="/pattern-lab"><BookOpen/> Exam Pattern Lab <ArrowRight className="ml-auto" size={16}/></Link>
    </div>
    <p className="text-sm text-muted-foreground flex items-start gap-2"><ShieldCheck size={18}/> Educational diagnostic evidence is limited to this browser. Knowledge DNA is not a medical, psychometric, or standardized mastery assessment.</p>
  </main>;
}
