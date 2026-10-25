import { useState } from "react";
import { Link } from "react-router-dom";
import { PencilRuler, Lightbulb } from "lucide-react";

const examples=[
  {title:"Uniform acceleration",question:"A body starts from rest, accelerates at 2 m/s² for 4 s. Find displacement in metres.",formula:"s = ut + ½at²",result:16,unit:"m",steps:["Identify u = 0, a = 2 m/s², t = 4 s.","Use s = ut + ½at².","Calculate s = 0 + ½ × 2 × 4² = 16 m."]},
  {title:"Newton's second law",question:"A constant net force of 24 N acts on an 8 kg mass. Find acceleration in m/s².",formula:"a = F/m",result:3,unit:"m/s²",steps:["Identify net force F = 24 N, mass m = 8 kg.","Use F = ma, then rearrange to a = F/m.","Compute a = 24/8 = 3 m/s²."]},
  {title:"Equivalent resistance",question:"Two series resistors have resistances 5 Ω and 7 Ω. Find total resistance in Ω.",formula:"R = R₁ + R₂",result:12,unit:"Ω",steps:["Recognize a series combination.","In series, resistances add: R = R₁ + R₂.","R = 5 + 7 = 12 Ω."]},
];
export default function StepClinic() {
  const [index,setIndex]=useState(0);const [answer,setAnswer]=useState("");
  const [hints,setHints]=useState(0);const [submitted,setSubmitted]=useState(false);
  const ex=examples[index];const valid=answer.trim()!==""&&Number.isFinite(Number(answer));
  const isCorrect=valid&&Number(answer)===ex.result;
  const change=(i:number)=>{setIndex(i);setAnswer("");setHints(0);setSubmitted(false)};
  return <main className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3"><p className="pixel-text text-xs text-primary">REASONING PRACTICE</p><h1 className="text-3xl flex items-center gap-2 font-bold"><PencilRuler/> Step Clinic</h1>
      <p className="text-muted-foreground">A guided, deterministic worked-solution exercise. It checks the final numerical answer, not a photographed or handwritten proof. Image recognition and full symbolic-step analysis require a separately verified AI backend.</p></header>
    <section className="pixel-panel p-6 space-y-5">
      <label className="block space-y-2">Worked example
        <select aria-label="Worked example" className="w-full p-3 rounded border bg-background" value={index} onChange={e=>change(Number(e.target.value))}>{examples.map((q,i)=><option value={i} key={q.title}>{q.title}</option>)}</select>
      </label>
      <h2 className="font-bold text-xl">{ex.question}</h2>
      <div className="space-y-2"><p className="font-semibold">Hints (reveal one at a time)</p>
        <ol className="ml-5 list-decimal text-sm space-y-2">{ex.steps.slice(0,hints).map(s=><li key={s}>{s}</li>)}</ol>
        <button className="pixel-btn inline-flex items-center gap-2" disabled={hints===3} onClick={()=>setHints(n=>Math.min(n+1,3))}><Lightbulb size={18}/> Show next hint</button>
      </div>
      <label className="block space-y-2">Enter your numerical result ({ex.unit})
        <input type="number" aria-label="Numerical result" className="w-full p-3 border rounded bg-background" value={answer} onChange={e=>{setAnswer(e.target.value);setSubmitted(false)}}/>
      </label>
      <button className="pixel-btn" disabled={!valid} onClick={()=>setSubmitted(true)}>Check result</button>
      {submitted&&<div role="status" className="p-4 rounded border bg-card space-y-2"><strong>{isCorrect?"Correct result.":"Not the expected result."}</strong>
        <p>{isCorrect?"Now try solving a different problem without the hints.":"Review the equation, substitution, units and sign. Reveal hints if needed."}</p>
        {hints===3&&<p>Worked answer: {ex.result} {ex.unit}.</p>}</div>}
    </section>
    <Link to="/labs" className="pixel-btn inline-block">Explore interactive concepts</Link>
  </main>;
}
