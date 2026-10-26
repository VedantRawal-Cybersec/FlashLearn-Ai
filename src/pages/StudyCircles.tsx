import { useState } from "react";
import { useNavigate,useSearchParams,Link } from "react-router-dom";
import { Users,Copy,Share2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { createSampleSession,type SampleTrack } from "@/lib/demo-session";

const allow=(x:string|null):SampleTrack=>x==="neet"?"neet":"jee-main";
export default function StudyCircles(){
  const [params]=useSearchParams();const navigate=useNavigate();
  const [track,setTrack]=useState<SampleTrack>(allow(params.get("track")));
  const [message,setMessage]=useState("");
  const add=useAppStore(s=>s.addSession);
  const share=()=>{
    // No student information, scores, or account IDs enter a shared URL.
    const link=window.location.origin+"/circles?track="+encodeURIComponent(track);
    if (!navigator.clipboard?.writeText) {
      setMessage("Copy this link manually: "+link);
      return;
    }
    void navigator.clipboard.writeText(link).then(()=>setMessage("Share link copied. It contains only the chosen sample track."),()=>{
      setMessage("Copy this link manually: "+link);
    });
  };
  const start=()=>{add(createSampleSession(track));navigate("/quiz")};
  return <main className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <p className="pixel-text text-xs text-primary">PEER LEARNING</p>
      <h1 className="text-3xl font-bold flex gap-3 items-center"><Users/> Study Circle Challenges</h1>
      <p className="text-muted-foreground">Share a five-question original sample with a classmate or teacher. Everyone answers on their own device. No email, score, or personal details are included in the link.</p>
    </header>
    <section className="pixel-panel p-6 space-y-4">
      <label className="block text-sm space-y-2">Choose a sample track
        <select aria-label="Challenge track" className="w-full border bg-background rounded p-3" value={track} onChange={e=>setTrack(allow(e.target.value))}>
          <option value="jee-main">JEE Main · Physics fundamentals</option>
          <option value="neet">NEET UG · Biology fundamentals</option>
        </select></label>
      <p className="text-sm">This challenge uses original demonstration questions, not official PYQs. The same fixed five questions are provided to each participant for fair independent practice.</p>
      <div className="flex flex-wrap gap-3">
        <button className="pixel-btn flex items-center gap-2" onClick={share}><Copy size={16}/> Copy challenge link</button>
        <button className="pixel-btn flex items-center gap-2" onClick={start}><Share2 size={16}/> Begin this challenge</button>
      </div>
      {message&&<p role="status" className="text-sm break-all">{message}</p>}
    </section>
    <div className="pixel-panel p-5 space-y-2">
      <h2 className="font-bold text-lg">How it works</h2>
      <p>1. Choose a sample. 2. Share the link using your own messaging app. 3. Each student completes the quiz individually. 4. Discuss explanations together.</p>
      <p className="text-sm text-muted-foreground">Live classrooms, account permissions, teacher assignments, shared gradebooks, and anti-cheat leaderboards are not provided by this offline challenge mode. Those require a secure, deployed classroom backend.</p>
      <Link to="/mistakes" className="text-primary underline text-sm">Review your own mistakes</Link>
    </div>
  </main>;
}
