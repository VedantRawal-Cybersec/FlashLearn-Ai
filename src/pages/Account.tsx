import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/lib/store";
import { previewCloudSync,newCloudSessions,uploadNewSessions, type CloudPreview } from "@/lib/cloud-sync";
import type { StudySession } from "@/lib/store";
import { Cloud, ShieldCheck, LogIn, LogOut, RefreshCcw } from "lucide-react";

export default function Account(){
  const [email,setEmail]=useState("");
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(false);
  const [notice,setNotice]=useState("");
  const [preview,setPreview]=useState<{cloud:StudySession[],summary:CloudPreview}|null>(null);
  const [consent,setConsent]=useState(false);
  const sessions=useAppStore(s=>s.sessions);
  const current=useAppStore(s=>s.currentSession);
  const importBackup=useAppStore(s=>s.importBackupData);
  const local=current?[current,...sessions.filter(s=>s.id!==current.id)]:sessions;
  useEffect(()=>{
    let live=true;
    void supabase.auth.getUser().then(({data,error})=>{
      if(live){setUser(error?null:data.user);if(error)setNotice("Account service: "+error.message)}
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(live){setUser(session?.user||null);setPreview(null);setConsent(false)}
    });
    return ()=>{live=false;subscription.unsubscribe()};
  },[]);
  const sendLink=async()=>{
    if(!email.trim())return;
    setLoading(true);setNotice("");
    try {
      const {error}=await supabase.auth.signInWithOtp({
        email:email.trim(),options:{emailRedirectTo:window.location.origin+"/account"},
      });
      if(error)throw error;
      setNotice("Check your inbox. Email delivery and redirect URLs must be enabled in your Supabase project.");
    } catch(e){setNotice(e instanceof Error?e.message:"Could not send sign-in link")}
    finally {setLoading(false)}
  };
  const inspect=async()=>{
    setLoading(true);setNotice("");setPreview(null);
    try {
      const next=await previewCloudSync(local);
      setPreview({cloud:next.cloud,summary:next.summary});
      setNotice("Cloud preview loaded. No student data was uploaded.");
    }catch(e){setNotice(e instanceof Error?e.message:"Cloud access unavailable")}
    finally{setLoading(false)}
  };
  const restore=()=>{
    if(!preview)return;
    setLoading(true);
    try{
      const added=newCloudSessions(local,preview.cloud);
      const restored=importBackup({version:1,sessions:added});
      setNotice("Restored "+restored+" new study sessions. Existing lessons were preserved.");
      setPreview(null);
    }catch(e){setNotice(e instanceof Error?e.message:"Restore failed")}
    finally{setLoading(false)}
  };
  const upload=async()=>{
    if(!user||!preview||!consent)return;
    setLoading(true);
    try{
      const count=await uploadNewSessions(user,local,preview.cloud);
      setNotice("Uploaded "+count+" new study sessions to your account. Conflicting IDs were not overwritten.");
      setConsent(false);setPreview(null);
    }catch(e){setNotice(e instanceof Error?e.message:"Cloud upload unavailable")}
    finally{setLoading(false)}
  };
  const logout=async()=>{setLoading(true);const {error}=await supabase.auth.signOut();setLoading(false);if(error)setNotice(error.message)};
  return <main className="container max-w-3xl px-5 py-10 space-y-6 animate-fade-in">
    <header className="pixel-panel p-6 space-y-3">
      <p className="pixel-text text-xs text-primary">OPTIONAL ACCOUNT</p>
      <h1 className="font-bold text-3xl flex items-center gap-2"><Cloud/> Secure Backup</h1>
      <p className="text-muted-foreground">Continue studying privately on this device without an account. Cloud storage is optional and only available after the backend security migration is deployed and verified.</p>
    </header>
    <section className="pixel-panel p-6 space-y-4">
      {user?<div className="space-y-3">
        <h2 className="text-xl font-bold flex gap-2 items-center"><ShieldCheck/> Signed in</h2>
        <p className="break-words">{user.email||"Authenticated student"}</p>
        <button className="pixel-btn inline-flex gap-2" onClick={logout} disabled={loading}><LogOut size={16}/> Sign out</button>
      </div>:<div className="space-y-3">
        <h2 className="text-xl font-bold flex gap-2 items-center"><LogIn/> Email sign-in</h2>
        <label className="block text-sm space-y-2">Your email
          <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}
            className="w-full rounded border bg-background p-3" placeholder="student@example.com" aria-label="Your email"/></label>
        <button className="pixel-btn" disabled={loading||!email.includes("@")} onClick={sendLink}>Email me a sign-in link</button>
      </div>}
      {notice&&<p className="text-sm break-words" role="status">{notice}</p>}
    </section>
    {user&&<section className="pixel-panel p-6 space-y-4">
      <h2 className="text-xl font-bold">Manual, conflict-safe cloud transfer</h2>
      <p className="text-sm text-muted-foreground">Nothing uploads automatically. Preview first, then explicitly choose to restore or upload. Sessions with the same ID but different content are never overwritten. Always keep an offline backup.</p>
      <button className="pixel-btn inline-flex gap-2" disabled={loading} onClick={inspect}><RefreshCcw size={16}/> Compare local and cloud sessions</button>
      {preview&&<div className="border rounded p-4 bg-card space-y-3">
        <p>{preview.summary.localOnly} local-only · {preview.summary.cloudOnly} cloud-only · {preview.summary.conflicts} conflicts · {preview.summary.alreadyPresent} identical</p>
        <button className="pixel-btn" disabled={loading||preview.summary.cloudOnly===0} onClick={restore}>Restore new cloud sessions to this device</button>
        <label className="flex gap-2 items-start text-sm">
          <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
          I authorize uploading the locally stored learning records to my private account. I have reviewed my backups.
        </label>
        <button className="pixel-btn" disabled={loading||!consent||preview.summary.localOnly===0} onClick={()=>{void upload()}}>Upload new local sessions</button>
      </div>}
    </section>}
    <div className="flex gap-3 flex-wrap"><Link to="/coach" className="pixel-btn">Export local backup</Link><Link to="/" className="pixel-btn">Continue without signing in</Link></div>
    <p className="text-xs text-muted-foreground">This interface does not migrate ownership of historical unrestricted database records or guarantee that the backend has been configured. An unavailable server returns an error and preserves local data.</p>
  </main>;
}
