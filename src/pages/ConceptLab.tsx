import { useState } from "react";
import { Link } from "react-router-dom";
import { Atom, Leaf, MoveDiagonal2 } from "lucide-react";

const round=(n:number)=>n.toFixed(2).replace(/\.00$/,"");
export default function ConceptLab() {
  const [mode,setMode]=useState<"physics"|"dna">("physics");
  const [angle,setAngle]=useState(30);
  const [mass,setMass]=useState(2);
  const [friction,setFriction]=useState(0.1);
  const [base,setBase]=useState("A");
  const theta=angle*Math.PI/180;
  const gravity=9.8;
  const parallel=mass*gravity*Math.sin(theta);
  const normal=mass*gravity*Math.cos(theta);
  const frictionForce=friction*normal;
  const acceleration=Math.max(0,(parallel-frictionForce)/mass);
  const complement:Record<string,string>={A:"T",T:"A",C:"G",G:"C"};
  const dnaExplanation:Record<string,string>={A:"Adenine pairs with thymine through two hydrogen bonds in standard DNA.",T:"Thymine pairs with adenine.",C:"Cytosine pairs with guanine through three hydrogen bonds in standard DNA.",G:"Guanine pairs with cytosine."};
  return <main className="container max-w-4xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3"><p className="pixel-text text-xs text-primary">INTERACTIVE SCIENCE</p><h1 className="text-3xl font-bold flex items-center gap-2"><Atom/> Concept Lab</h1>
      <p className="text-muted-foreground">Change one variable and see its effect. Models are simplified teaching demonstrations with explicit assumptions—not official examination questions.</p></header>
    <div className="flex gap-2 flex-wrap">
      <button className="pixel-btn" aria-pressed={mode==="physics"} onClick={()=>setMode("physics")}>Inclined-plane forces</button>
      <button className="pixel-btn" aria-pressed={mode==="dna"} onClick={()=>setMode("dna")}>DNA base pairing</button>
    </div>
    {mode==="physics"?<section className="pixel-panel p-5 space-y-6">
      <h2 className="text-xl font-semibold flex gap-2 items-center"><MoveDiagonal2/> Explore an inclined plane</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg bg-card border p-3">
          <svg viewBox="0 0 340 260" className="w-full h-auto" role="img" aria-label={"Inclined plane at "+angle+" degrees, block mass "+mass+" kilograms"}>
            <defs><marker id="vArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor"/></marker></defs>
            <polygon points={`30,222 300,222 300,${222-Math.tan(theta)*225}`} fill="hsl(var(--primary)/0.15)" stroke="currentColor" strokeWidth="2"/>
            <g transform={`translate(150,${222-Math.tan(theta)*120}) rotate(-${angle})`}>
              <rect x="-16" y="-32" width="42" height="30" rx="4" fill="hsl(var(--primary))" stroke="currentColor"/>
              <text x="5" y="-12" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="11">{mass} kg</text>
              <line x1="0" y1="0" x2="-60" y2="0" stroke="#e879f9" strokeWidth="3" markerEnd="url(#vArrow)"/>
              <line x1="0" y1="0" x2="0" y2="-55" stroke="#34d399" strokeWidth="3" markerEnd="url(#vArrow)"/>
            </g>
            <text x="36" y="242" fill="currentColor" fontSize="12">θ = {angle}°</text>
            <text x="203" y="250" fill="currentColor" fontSize="10">Illustrative, not to scale</text>
          </svg>
          <p className="text-xs text-muted-foreground">Pink: downhill component of weight. Green: normal force direction. Block is drawn schematically.</p>
        </div>
        <div className="space-y-4">
          <label className="block text-sm space-y-2">Incline angle: <strong>{angle}°</strong>
            <input type="range" aria-label="Incline angle" min={0} max={60} step={5} value={angle} className="w-full accent-primary" onChange={e=>setAngle(Number(e.target.value))}/></label>
          <label className="block text-sm space-y-2">Block mass: <strong>{mass} kg</strong>
            <input type="range" aria-label="Block mass" min={1} max={10} step={1} value={mass} className="w-full accent-primary" onChange={e=>setMass(Number(e.target.value))}/></label>
          <label className="block text-sm space-y-2">Assumed kinetic friction coefficient: <strong>{friction.toFixed(2)}</strong>
            <input type="range" aria-label="Kinetic friction coefficient" min={0} max={0.8} step={0.05} value={friction} className="w-full accent-primary" onChange={e=>setFriction(Number(e.target.value))}/></label>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="bg-card p-4 border"><p className="text-xs text-muted-foreground">Down-slope gravity</p><strong className="text-xl">{round(parallel)} N</strong></div>
        <div className="bg-card p-4 border"><p className="text-xs text-muted-foreground">Normal force</p><strong className="text-xl">{round(normal)} N</strong></div>
        <div className="bg-card p-4 border"><p className="text-xs text-muted-foreground">Acceleration if sliding</p><strong className="text-xl">{round(acceleration)} m/s²</strong></div>
      </div>
      <div className="bg-card p-4 border rounded-lg space-y-2"><h3 className="font-bold">Why those values change</h3>
        <p className="text-sm">Along the incline: mg sin θ = {round(parallel)} N; perpendicular: mg cos θ = {round(normal)} N. For a sliding block with kinetic friction, friction magnitude μN = {round(frictionForce)} N.</p>
        <p className="text-sm text-muted-foreground">The acceleration estimate assumes motion down the plane and a constant kinetic friction coefficient. When gravity's down-slope component cannot overcome friction, the interface displays zero; deciding whether the block starts moving requires a separate static-friction model. Air resistance is ignored.</p>
      </div>
    </section>:<section className="pixel-panel p-5 space-y-5">
      <h2 className="text-xl font-semibold flex items-center gap-2"><Leaf/> DNA base-pair exploration</h2>
      <p>Select a DNA base and see its complementary partner in canonical double-stranded DNA.</p>
      <div className="flex flex-wrap gap-2">{["A","T","C","G"].map(v=><button key={v} aria-pressed={base===v} className={"border rounded-lg p-4 text-lg font-bold "+(base===v?"border-primary bg-primary/20":"bg-card")} onClick={()=>setBase(v)}>{v}</button>)}</div>
      <div className="bg-card border p-7 flex gap-4 justify-center items-center text-4xl font-bold rounded-lg"><span>{base}</span><span className="text-primary">↔</span><span>{complement[base]}</span></div>
      <p className="text-sm">{dnaExplanation[base]}</p>
      <p className="text-sm text-muted-foreground">This is a fundamental molecular genetics demonstration; actual DNA structure and processes require further biological context.</p>
    </section>}
    <div className="flex gap-3 flex-wrap"><Link to="/brain" className="pixel-btn">Knowledge DNA</Link><Link to="/planner" className="pixel-btn">Exam Planner</Link></div>
  </main>;
}
