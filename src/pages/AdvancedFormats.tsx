import {useState} from "react";
import {Link} from "react-router-dom";
import { CheckSquare, BookMarked } from "lucide-react";
import {ADVANCED_FORMAT_DEMOS, BOARD_FORMAT_DEMO,gradeMultiAnswer} from "@/lib/exam-formats";
export default function AdvancedFormats(){
  const [mode,setMode]=useState<"advanced"|"board">("advanced");
  const [answers,setAnswers]=useState<Record<string,number[]>>({});
  const [graded,setGraded]=useState(false);
  const [rubric,setRubric]=useState<number[]>([]);
  const score=gradeMultiAnswer(ADVANCED_FORMAT_DEMOS,answers);
  const toggle=(id:string,i:number)=>{
    setAnswers(a=>({...a,[id]:(a[id]||[]).includes(i)?a[id].filter(x=>x!==i):[...(a[id]||[]),i]}));setGraded(false);
  };
  return <main className="container max-w-4xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <p className="pixel-text text-xs text-primary">EXAM QUESTION TYPES</p>
      <h1 className="text-3xl font-bold flex gap-2 items-center"><CheckSquare/> Advanced Format Workshop</h1>
      <p className="text-muted-foreground">Practise multiple-correct selection and written-answer self-assessment. These are original format demonstrations—not actual JEE Advanced 2026 paper instructions or official board marking schemes.</p>
    </header>
    <div className="flex flex-wrap gap-3">
      <button className="pixel-btn" aria-pressed={mode==="advanced"} onClick={()=>setMode("advanced")}>Multiple-correct practice</button>
      <button className="pixel-btn" aria-pressed={mode==="board"} onClick={()=>setMode("board")}>Board-style self-assessment</button>
    </div>
    {mode==="advanced"?<div className="space-y-4">
      {ADVANCED_FORMAT_DEMOS.map((q,index)=><article className="pixel-panel p-5 space-y-3" key={q.id}>
        <p className="text-sm text-primary">Question {index+1} · {q.subject} · Select all that apply</p>
        <h2 className="font-semibold">{q.prompt}</h2>
        {q.options.map((option,i)=><label key={i} className="flex gap-2 cursor-pointer p-3 border bg-card rounded text-sm items-start">
          <input type="checkbox" aria-label={q.id+": "+option} checked={(answers[q.id]||[]).includes(i)} onChange={()=>toggle(q.id,i)}/>
          <span>{String.fromCharCode(65+i)}. {option}</span>
        </label>)}
        {graded&&<div className="bg-card border rounded p-3 text-sm space-y-1">
          <strong>Correct: {q.correctIndices.map(i=>String.fromCharCode(65+i)).join(", ")}</strong>
          <p>{q.explanation}</p>
        </div>}
      </article>)}
      <div className="pixel-panel p-5 space-y-2">
        <button className="pixel-btn" onClick={()=>setGraded(true)}>Check selections</button>
        {graded&&<div role="status"><p>{score.exact} exact · {score.incorrect} incorrect · {score.unanswered} skipped</p>
          <p>Illustrative demo score: {score.illustrativeScore}/{score.maxScore} (+4 exact, −2 incorrect, 0 skipped).</p>
          <p className="text-xs text-muted-foreground">Actual JEE Advanced marking varies by question and paper and can include partial credit. Do not use this illustrative score as an official score estimate.</p>
        </div>}
      </div>
    </div>:<section className="pixel-panel p-6 space-y-4">
      <h2 className="font-bold text-xl flex gap-2 items-center"><BookMarked/> Written-response self-check</h2>
      <p className="font-semibold">{BOARD_FORMAT_DEMO.prompt}</p>
      <p className="text-sm">Think or write your own answer offline, then tick each criterion only when your response clearly contains it.</p>
      {BOARD_FORMAT_DEMO.rubric.map((criterion,i)=><label key={criterion.text} className="flex items-start gap-3 text-sm p-3 bg-card border rounded">
        <input type="checkbox" aria-label={criterion.text} checked={rubric.includes(i)} onChange={()=>setRubric(a=>a.includes(i)?a.filter(x=>x!==i):[...a,i])}/>
        <span>{criterion.text} ({criterion.points} mark)</span></label>)}
      <div role="status" className="p-3 border rounded bg-card"><strong>Self-assessed: {rubric.reduce((n,i)=>n+BOARD_FORMAT_DEMO.rubric[i].points,0)}/{BOARD_FORMAT_DEMO.marks}</strong>
        <p className="text-sm">{BOARD_FORMAT_DEMO.note}</p></div>
    </section>}
    <div className="flex gap-3 flex-wrap"><Link className="pixel-btn" to="/pattern-lab">JEE/NEET Mini Practice</Link><Link className="pixel-btn" to="/brain">Knowledge DNA</Link></div>
  </main>;
}
