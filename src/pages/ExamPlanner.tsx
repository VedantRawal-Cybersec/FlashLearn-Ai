import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckSquare, Clock3, Target } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getLearningInsights } from "@/lib/learning-intelligence";

interface PlanSettings { goal: string; examDate: string; minutes: number }
const KEY="flashlearn-plan-v1";
const defaults:PlanSettings={goal:"JEE Main",examDate:"",minutes:90};
const load=():PlanSettings=>{try{const v=JSON.parse(localStorage.getItem(KEY)||"{}");return {...defaults,...v,minutes:Number(v.minutes)||90};}catch{return defaults}};
export default function ExamPlanner() {
  const [settings,setSettings]=useState<PlanSettings>(load);
  const [checked,setChecked]=useState<Record<string,boolean>>(()=>{try{return JSON.parse(localStorage.getItem("flashlearn-plan-tasks-v1")||"{}")}catch{return {}}});
  const sessions=useAppStore(s=>s.sessions);
  const current=useAppStore(s=>s.currentSession);
  const topics=useMemo(()=>getLearningInsights(current?[current,...sessions]:sessions),[current,sessions]);
  const save=(changes:Partial<PlanSettings>)=>{const next={...settings,...changes};setSettings(next);try{localStorage.setItem(KEY,JSON.stringify(next))}catch{}};
  const today=new Date();today.setHours(12,0,0,0);
  const target=settings.examDate?new Date(settings.examDate+"T12:00:00"):null;
  const remaining=target&&!Number.isNaN(target.getTime())?Math.ceil((target.getTime()-today.getTime())/86400000):null;
  const days=Array.from({length:7},(_,index)=>{
    const day=new Date(today);day.setDate(today.getDate()+index);
    const topic=topics[index%Math.max(1,topics.length)]?.name||"Revise one selected chapter";
    const minutes=Math.max(20,Math.min(720,settings.minutes));
    const practice=Math.max(10,Math.round(minutes*0.55));
    const review=Math.max(5,Math.round(minutes*0.3));
    return {date:day.toISOString().slice(0,10),label:day.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}),topic,practice,review,reflect:minutes-practice-review};
  });
  const toggle=(key:string)=>{const next={...checked,[key]:!checked[key]};setChecked(next);try{localStorage.setItem("flashlearn-plan-tasks-v1",JSON.stringify(next))}catch{}};
  return <main className="container max-w-5xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-2"><p className="pixel-text text-xs text-primary">PERSONAL STUDY PLANNER</p>
      <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays/> Exam-Day Planner</h1>
      <p className="text-muted-foreground">A realistic seven-day schedule using your recorded priorities. Adapt study time to your circumstances; exam date is entered by you, not assumed from a past year's exam.</p></header>
    <section className="pixel-panel p-5 grid gap-4 sm:grid-cols-3">
      <label className="space-y-1 text-sm"><span className="font-semibold">Preparation goal</span>
        <select aria-label="Preparation goal" className="w-full p-3 rounded border bg-background" value={settings.goal} onChange={e=>save({goal:e.target.value})}>
          {["JEE Main","JEE Advanced","NEET UG","KCET","CBSE Board","Other exam"].map(x=><option key={x}>{x}</option>)}
        </select></label>
      <label className="space-y-1 text-sm"><span className="font-semibold">Target exam date</span>
        <input className="w-full p-3 rounded border bg-background" aria-label="Target exam date" type="date" value={settings.examDate} onChange={e=>save({examDate:e.target.value})}/></label>
      <label className="space-y-1 text-sm"><span className="font-semibold">Daily available minutes</span>
        <input className="w-full p-3 rounded border bg-background" aria-label="Daily available minutes" type="number" min={20} max={720} step={10} value={settings.minutes} onChange={e=>save({minutes:Math.min(720,Math.max(20,Number(e.target.value)||20))})}/></label>
    </section>
    {remaining!==null&&<p role="status" className="pixel-panel p-4">{remaining>=0?remaining+" days until your entered date.":"Your entered exam date is in the past. Update the target date."}</p>}
    <section className="space-y-3"><h2 className="text-xl font-bold flex items-center gap-2"><Target/> Seven-day mission plan</h2>
      <p className="text-sm text-muted-foreground">Each day includes practice, due-card review and short reflection. The same weak topic may recur deliberately; it is a recommendation, not an automated notification.</p>
      <div className="grid md:grid-cols-2 gap-3">{days.map((day,i)=><article className="pixel-panel p-5 space-y-3" key={day.date}>
        <div className="flex items-center justify-between"><strong>Day {i+1} · {day.label}</strong><span className="text-xs flex items-center gap-1"><Clock3 size={14}/>{settings.minutes} min</span></div>
        <h3 className="font-semibold">{day.topic}</h3>
        {[[String(day.practice)+" min targeted practice","practice"],[String(day.review)+" min spaced review","review"],[String(day.reflect)+" min error reflection","reflect"]].map(([label,type])=>{
          const id=day.date+"-"+type;
          return <label key={id} className="flex gap-2 text-sm items-center cursor-pointer">
            <input type="checkbox" checked={!!checked[id]} onChange={()=>toggle(id)} aria-label={day.label+": "+label}/>
            <span className={checked[id]?"line-through text-muted-foreground":""}>{label}</span>
          </label>;
        })}</article>)}</div>
    </section>
    <div className="flex flex-wrap gap-3"><Link to="/rescue" className="pixel-btn inline-flex items-center gap-2"><CheckSquare size={18}/> Start a Rescue Mission</Link><Link to="/review" className="pixel-btn">Review due cards</Link></div>
    <p className="text-sm text-muted-foreground">Saved on this device. No calendar notifications, automatic booking, or exam rank predictions are created.</p>
  </main>;
}
