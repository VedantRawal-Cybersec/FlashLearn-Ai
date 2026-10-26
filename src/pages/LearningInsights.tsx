import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Download, GraduationCap } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { buildLearningMetrics,metricsCsv } from "@/lib/learning-metrics";

export default function LearningInsights(){
  const sessions=useAppStore(s=>s.sessions),current=useAppStore(s=>s.currentSession);
  const stats=useMemo(()=>buildLearningMetrics(current?[current,...sessions]:sessions),[sessions,current]);
  const max=Math.max(1,...stats.series.map(d=>d.answered));
  const save=()=>{
    const b=new Blob([metricsCsv(stats)],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(b);const a=document.createElement("a");
    a.href=url;a.download="flash-learn-private-activity.csv";
    a.click();URL.revokeObjectURL(url);
  };
  return <main className="container max-w-5xl px-5 py-10 space-y-7 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <p className="pixel-text text-xs text-primary">YOUR ACTUAL DATA</p>
      <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3/> Learning Insights</h1>
      <p className="text-muted-foreground">A local view of recorded quiz attempts. Data stays in this browser; these numbers do not represent nationwide ranks, commercial analytics, or unrecorded study time.</p>
    </header>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[[stats.attempts,"Completed quiz attempts"],[stats.answered,"Questions answered"],[stats.accuracy===null?"—":stats.accuracy+"%","Observed accuracy"],[stats.activeDays,"Days with an attempt"]].map(([n,name])=>
        <div className="pixel-panel p-5" key={name}><strong className="text-2xl block">{n}</strong><p className="text-sm text-muted-foreground">{name}</p></div>)}
    </div>
    <section className="pixel-panel p-6 space-y-4">
      <h2 className="font-bold text-xl">Answered questions by study date</h2>
      {!stats.series.length?<p>No recorded attempts yet. <Link to="/" className="text-primary underline">Start a sample quiz</Link> to collect your first data.</p>:
        <div className="space-y-3" role="list">{stats.series.slice(-30).map(day=><div role="listitem" key={day.date} className="grid grid-cols-[7rem_1fr_4rem] gap-3 items-center text-sm">
          <time dateTime={day.date}>{day.date}</time>
          <div className="h-4 bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{width:(day.answered/max*100)+"%"}}/></div>
          <span className="tabular-nums text-right">{day.correct}/{day.answered}</span>
        </div>)}</div>}
      <button className="pixel-btn inline-flex items-center gap-2" disabled={!stats.series.length} onClick={save}><Download size={16}/> Export CSV</button>
    </section>
    <section className="pixel-panel p-5 space-y-2">
      <h2 className="text-xl font-bold flex items-center gap-2"><GraduationCap/> Next learning action</h2>
      <p>{stats.dueCards} flashcards are due now. Continue review and use Rescue Mode for missed questions.</p>
      <div className="flex flex-wrap gap-3"><Link className="pixel-btn" to="/review">Daily Review</Link><Link className="pixel-btn" to="/rescue">Rescue Mode</Link></div>
    </section>
    <p className="text-sm text-muted-foreground">Privacy note: no third-party event pixels or analytics requests are added by this feature. This does not measure unique users, activation, paid conversion, or platform retention cohorts.</p>
  </main>;
}
