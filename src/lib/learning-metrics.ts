import type { StudySession } from "@/lib/store";
import { isReviewDue } from "@/lib/spaced-repetition";
export interface DayMetric { date: string; attempts: number; answered: number; correct: number; wrong: number; skipped: number }
export interface Metrics {
  totalSessions: number; attempts: number; answered: number; correct: number;
  accuracy: number|null; dueCards: number; activeDays: number; series: DayMetric[];
}
export function buildLearningMetrics(sessions: StudySession[], now=new Date()):Metrics {
  const days=new Map<string,DayMetric>();
  const unique=sessions.filter((s,i,a)=>a.findIndex(t=>t.id===s.id)===i);
  let totalAttempts=0,answered=0,correct=0;
  for(const session of unique){
    for(const attempt of session.quizAttempts||[]) {
      const time=Date.parse(attempt.completedAt);
      if(!Number.isFinite(time))continue;
      const day=new Date(time).toISOString().slice(0,10);
      const row=days.get(day)||{date:day,attempts:0,answered:0,correct:0,wrong:0,skipped:0};
      const validAnswers=Math.max(0,Math.min(attempt.total,attempt.attempted));
      const validCorrect=Math.max(0,Math.min(validAnswers,attempt.correct));
      row.attempts++;
      row.answered+=validAnswers;
      row.correct+=validCorrect;
      row.wrong+=Math.max(0,validAnswers-validCorrect);
      row.skipped+=Math.max(0,attempt.total-validAnswers);
      totalAttempts++;answered+=validAnswers;correct+=validCorrect;
      days.set(day,row);
    }
  }
  const series=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
  return {
    totalSessions:unique.length,attempts:totalAttempts,answered,correct,
    accuracy:answered?Math.round(correct/answered*100):null,
    activeDays:series.length,
    dueCards:unique.reduce((n,s)=>n+s.flashcards.filter(c=>isReviewDue(c,now)).length,0),
    series,
  };
}
export function metricsCsv(metrics:Metrics):string {
  const rows=["Date,Quiz attempts,Answered,Correct,Wrong,Skipped"];
  for(const d of metrics.series) rows.push([d.date,d.attempts,d.answered,d.correct,d.wrong,d.skipped].join(","));
  return rows.join("\n");
}
