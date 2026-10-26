import { describe,expect,it } from "vitest";
import { createSampleSession } from "@/lib/demo-session";
import { compareSessions,newCloudSessions } from "@/lib/cloud-sync";
describe("cloud transfer reconciliation",()=>{
 const local=createSampleSession("neet","a");
 const cloud=createSampleSession("jee-main","b");
 it("keeps local and cloud rows separate",()=>{
   expect(compareSessions([local],[cloud])).toEqual({
     localOnly:1,cloudOnly:1,conflicts:0,alreadyPresent:0,
   });
   expect(newCloudSessions([local],[cloud]).map(s=>s.id)).toEqual(["b"]);
 });
 it("does not merge or silently overwrite divergent IDs",()=>{
   const changed={...local,title:"Conflicting title"};
   expect(compareSessions([local],[changed]).conflicts).toBe(1);
   expect(newCloudSessions([local],[changed])).toHaveLength(0);
 });
 it("ignores identical records",()=>{
   expect(compareSessions([local],[local])).toEqual({
     localOnly:0,cloudOnly:0,conflicts:0,alreadyPresent:1,
   });
 });
});
