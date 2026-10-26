import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {ImagePlus,ShieldAlert} from "lucide-react";
import {supabase} from "@/integrations/supabase/client";
import {validateHandwritingImage} from "@/lib/handwriting-validation";
interface Review {extractedSteps:string[];uncertain:boolean;likelyError:string;hint:string;checkedReasoning:string;safetyNote:string}
export default function HandwritingReview(){
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState("");
 const [question,setQuestion]=useState(""),[result,setResult]=useState<Review|null>(null);
 const [status,setStatus]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!file){setPreview("");return}
  const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file]);
 const choose=(incoming?:File)=>{
   setResult(null);setStatus("");
   if(!incoming){setFile(null);return}
   const error=validateHandwritingImage(incoming);
   if(error){setFile(null);setStatus(error);return}
   setFile(incoming);
 };
 const analyze=async()=>{
   if(!file)return;
   setBusy(true);setResult(null);setStatus("");
   try{
     const {data:{user},error:authError}=await supabase.auth.getUser();
     if(authError||!user)throw new Error("Sign in on My Account before using paid AI image analysis.");
     const base64=await new Promise<string>((resolve,reject)=>{
       const reader=new FileReader();
       reader.onload=()=>resolve(String(reader.result).split(",")[1]||"");
       reader.onerror=()=>reject(new Error("Cannot read image"));
       reader.readAsDataURL(file);
     });
     const {data,error}=await supabase.functions.invoke("analyze-handwriting",{body:{imageBase64:base64,fileType:file.type,question:question.slice(0,1800)}});
     if(error||data?.error)throw new Error(data?.error||error?.message||"Analysis service unavailable");
     if(!Array.isArray(data?.extractedSteps)||typeof data?.hint!=="string")throw new Error("Invalid analysis response");
     setResult(data as Review);
   }catch(e){setStatus(e instanceof Error?e.message:"AI service unavailable")}
   finally{setBusy(false)}
 };
 return <main className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
  <header className="pixel-panel p-6 space-y-3"><p className="pixel-text text-xs text-primary">OPTIONAL AI VISION</p>
   <h1 className="text-3xl font-bold flex items-center gap-2"><ImagePlus/> Handwritten Solution Review</h1>
   <p className="text-muted-foreground">Upload a single photo of your handwritten working. When the authenticated backend is deployed, AI may suggest a likely incorrect step and a hint. It cannot guarantee that transcription or grading is correct.</p></header>
  <section className="pixel-panel p-6 space-y-4">
   <label className="block space-y-2">Photo of your solution (under 2 MB)
     <input type="file" aria-label="Handwritten solution image" accept="image/png,image/jpeg,image/webp" className="block w-full" onChange={e=>choose(e.target.files?.[0])}/></label>
   {preview&&<img src={preview} className="max-h-60 mx-auto rounded object-contain border" alt="Preview of selected handwritten solution"/>}
   <label className="block space-y-2">Original question (optional but helps context)
     <textarea aria-label="Original question" value={question} onChange={e=>setQuestion(e.target.value)} maxLength={1800}
       className="w-full bg-background border rounded p-3" rows={3}/></label>
   <button className="pixel-btn" disabled={!file||busy} onClick={()=>{void analyze()}}>{busy?"Examining image…":"Analyze handwritten work"}</button>
   {status&&<p role="status" className="text-sm text-destructive">{status}</p>}
  </section>
  {result&&<section className="pixel-panel p-6 space-y-4">
   <h2 className="text-xl font-bold">AI-assisted review</h2>
   {result.uncertain&&<p className="font-semibold text-amber-600 flex items-center gap-2"><ShieldAlert size={18}/> Handwriting may be ambiguous. Verify before changing your solution.</p>}
   <div><strong>Recognized steps</strong><ol className="list-decimal ml-5 text-sm space-y-1">{result.extractedSteps.map((v,i)=><li key={i}>{v}</li>)}</ol></div>
   {result.likelyError&&<p><strong>Possible first mistake:</strong> {result.likelyError}</p>}
   {result.hint&&<p><strong>Hint:</strong> {result.hint}</p>}
   {result.checkedReasoning&&<details><summary className="cursor-pointer font-semibold">Show AI explanation</summary><p className="mt-2 text-sm">{result.checkedReasoning}</p></details>}
   <p className="text-xs text-muted-foreground">{result.safetyNote}</p>
  </section>}
  <p className="text-sm text-muted-foreground">This feature requires Supabase Auth, server-enforced daily AI quotas, an authorized AI gateway key, and a deployed Edge Function. If any are unavailable, the tool must fail safely without generating imaginary analysis or charging your account.</p>
  <div className="flex flex-wrap gap-3"><Link to="/account" className="pixel-btn">My Account</Link><Link to="/clinic" className="pixel-btn">Offline Step Clinic</Link></div>
 </main>;
}
