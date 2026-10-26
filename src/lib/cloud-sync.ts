import type { SupabaseClient, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { validateStudyBackup } from "@/lib/study-backup";
import type { StudySession } from "@/lib/store";

// New table is not represented by the old generated Database type until the
// operator updates types from the authorized Supabase project.
const db = supabase as unknown as SupabaseClient;
export const CLOUD_TABLE = "private_study_sessions";
export interface CloudPreview { localOnly: number; cloudOnly: number; conflicts: number; alreadyPresent: number }
function parseRows(value: unknown): StudySession[] {
  if (!Array.isArray(value)) throw new Error("Invalid server response.");
  return validateStudyBackup({version:1,sessions:value.map((row) => {
    if (!row || typeof row !== "object" || !("payload" in row)) throw new Error("Corrupt cloud session.");
    return row.payload;
  })});
}
export async function requireCloudUser():Promise<User> {
  const {data,error}=await supabase.auth.getUser();
  if(error || !data.user) throw new Error("Sign in first. Your local data is unchanged.");
  return data.user;
}
export async function getCloudSessions(user:User):Promise<StudySession[]> {
  const { data,error }=await db.from(CLOUD_TABLE)
    .select("id,payload").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);
  if(error) throw new Error("Secure cloud storage is unavailable: "+error.message);
  return parseRows(data);
}
export function compareSessions(local:StudySession[],remote:StudySession[]):CloudPreview {
  const a=new Map(local.map(s=>[s.id,s]));
  const b=new Map(remote.map(s=>[s.id,s]));
  let localOnly=0,cloudOnly=0,conflicts=0,alreadyPresent=0;
  for(const [id,s] of a) {
    const existing=b.get(id);
    if(!existing)localOnly++;
    else if(JSON.stringify(s)===JSON.stringify(existing))alreadyPresent++;
    else conflicts++;
  }
  for(const id of b.keys())if(!a.has(id))cloudOnly++;
  return {localOnly,cloudOnly,conflicts,alreadyPresent};
}
export async function previewCloudSync(local:StudySession[]) {
  const user=await requireCloudUser();
  const cloud=await getCloudSessions(user);
  return {user,cloud,summary:compareSessions(local,cloud)};
}
/** Conservative import: never overwrite existing local IDs or ambiguous legacy data. */
export function newCloudSessions(local:StudySession[],remote:StudySession[]) {
  const ids=new Set(local.map(s=>s.id));
  return remote.filter(s=>!ids.has(s.id));
}
/** User-initiated upload, only missing records. Conflicting same-ID data remains untouched. */
export async function uploadNewSessions(user:User,local:StudySession[],remote:StudySession[]) {
  const remoteIds=new Set(remote.map(s=>s.id));
  const rows=local.filter(s=>!remoteIds.has(s.id)).map(s=>({
    id:s.id,user_id:user.id,title:s.title.slice(0,500),payload:s,
  }));
  if(!rows.length)return 0;
  const {error}=await db.from(CLOUD_TABLE).insert(rows);
  if(error)throw new Error("Cloud upload failed without deleting local data: "+error.message);
  return rows.length;
}
