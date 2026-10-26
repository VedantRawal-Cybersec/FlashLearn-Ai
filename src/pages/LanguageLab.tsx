import {useState} from "react";
import {Languages} from "lucide-react";
type Lang="hi"|"kn";
const terms=[
  {en:"Force",hi:"बल",kn:"ಬಲ",explain:"An interaction that can change an object's state of motion."},
  {en:"Acceleration",hi:"त्वरण",kn:"ವೇಗೋತ್ಕರ್ಷ",explain:"Rate of change of velocity with time."},
  {en:"Displacement",hi:"विस्थापन",kn:"ಸ್ಥಳಾಂತರ",explain:"Change of position with direction."},
  {en:"Velocity",hi:"वेग",kn:"ವೇಗ",explain:"Displacement per unit time."},
  {en:"Momentum",hi:"संवेग",kn:"ಸಂವೇಗ",explain:"Mass multiplied by velocity."},
  {en:"Resistance",hi:"प्रतिरोध",kn:"ಪ್ರತಿರೋಧ",explain:"Opposition to electric current."},
  {en:"Work",hi:"कार्य",kn:"ಕೆಲಸ",explain:"Energy transfer due to a force acting through displacement."},
  {en:"Cell",hi:"कोशिका",kn:"ಕೋಶ",explain:"Basic structural and functional unit of living organisms."},
  {en:"Nucleus",hi:"केन्द्रक",kn:"ಕೇಂದ್ರಕ",explain:"Organelle containing most of a eukaryotic cell's genetic material."},
  {en:"Ribosome",hi:"राइबोसोम",kn:"ರೈಬೋಸೋಮ್",explain:"Molecular complex that makes proteins by translating mRNA."},
  {en:"Kidney",hi:"वृक्क",kn:"ಮೂತ್ರಪಿಂಡ",explain:"Organ that filters blood and regulates water and solute balance."},
  {en:"Photosynthesis",hi:"प्रकाश संश्लेषण",kn:"ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ",explain:"Process converting light energy into chemical energy in photosynthetic organisms."},
];
export default function LanguageLab(){
 const [lang,setLang]=useState<Lang>("hi"),[filter,setFilter]=useState("");
 const shown=terms.filter(t=>(t.en+" "+t.hi+" "+t.kn).toLowerCase().includes(filter.toLowerCase()));
 return <main className="container max-w-4xl px-5 py-10 space-y-6 animate-fade-in">
  <header className="pixel-panel p-6 space-y-3"><p className="pixel-text text-xs text-primary">LANGUAGE ACCESS</p>
   <h1 className="text-3xl font-bold flex items-center gap-2"><Languages/> Bilingual Concept Glossary</h1>
   <p className="text-muted-foreground">Common JEE/NEET vocabulary with English explanations and Hindi or Kannada labels. This limited reference is not complete translated curriculum or an officially reviewed examination glossary.</p></header>
  <section className="pixel-panel p-5 flex flex-wrap gap-3 items-center">
   <label className="flex-1 min-w-[160px]">Search term<input aria-label="Search concept" className="border p-2 bg-background rounded w-full mt-1" value={filter} onChange={e=>setFilter(e.target.value)}/></label>
   <label>Language<select aria-label="Learning language" className="border p-2 rounded bg-background ml-2" value={lang} onChange={e=>setLang(e.target.value as Lang)}>
    <option value="hi">Hindi (हिन्दी)</option><option value="kn">Kannada (ಕನ್ನಡ)</option>
   </select></label>
  </section>
  <div className="grid md:grid-cols-2 gap-3">
   {shown.map(t=><article key={t.en} className="pixel-panel p-5 space-y-2">
    <h2 className="font-bold text-xl">{t.en}</h2><p className="text-primary font-medium text-lg">{t[lang]}</p><p className="text-sm">{t.explain}</p>
   </article>)}
  </div>
  {shown.length===0&&<p className="pixel-panel p-5">No matching term. Try another concept.</p>}
  <p className="text-sm text-muted-foreground">All scientific explanations are currently in English. Translations require subject-expert and linguistic review before use as an authoritative bilingual curriculum.</p>
 </main>;
}
