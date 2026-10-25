import { describe,it,expect } from "vitest";
import { validateStudyBackup } from "@/lib/study-backup";
import { createSampleSession } from "@/lib/demo-session";
describe("safe student backup import",()=>{
  it("accepts a valid exported quiz and review schedule",()=>{
    const sample=createSampleSession("neet","saved");
    sample.flashcards[0].review={lastReviewedAt:"2026-10-25T09:00:00Z",dueAt:"2026-10-26T09:00:00Z",intervalDays:1,easeFactor:2.5,repetitions:1,lapses:0};
    expect(validateStudyBackup({version:1,sessions:[sample]})).toHaveLength(1);
  });
  it("rejects malformed backups and corrupted answers",()=>{
    expect(()=>validateStudyBackup({version:4,sessions:[]})).toThrow();
    const s=createSampleSession("jee-main","bad");
    s.quizQuestions[0].correctIndex=9;
    expect(()=>validateStudyBackup({version:1,sessions:[s]})).toThrow();
  });
  it("rejects duplicate IDs",()=>{
    const s=createSampleSession("neet","duplicate");
    expect(()=>validateStudyBackup({version:1,sessions:[s,s]})).toThrow();
  });
});
