import { describe,it,expect } from "vitest";
import { createSampleSession } from "@/lib/demo-session";
import { buildQuizAttempt } from "@/lib/quiz-history";
import { getLearningInsights, pickRescue, diagnoseError } from "@/lib/learning-intelligence";
import { EXAM_SPECS, ORIGINAL_NUMERICAL_ITEMS, gradePractice } from "@/lib/exam-specifications";
import { inspectOriginalQuestions, inspectPracticeItems } from "@/lib/question-integrity";

describe("learning evidence must be honest",()=>{
  it("does not infer correct responses from legacy mistakes-only history",()=>{
    const s=createSampleSession("neet","legacy");
    s.quizAttempts=[{id:"old",kind:"quiz",completedAt:new Date().toISOString(),attempted:5,correct:4,total:5,
      mistakes:[{questionId:s.quizQuestions[0].id,topic:"Cell biology",question:s.quizQuestions[0].question,correct:"Ribosomes",explanation:"Review cell biology"}]}];
    const x=getLearningInsights([s]).find(d=>d.name==="Cell biology")!;
    expect(x.accuracy).toBeNull();
    expect(x.errors).toBe(1);
  });
  it("counts correct and incorrect answers from explicit answer evidence",()=>{
    const s=createSampleSession("neet","attempted");
    s.quizQuestions[0].userAnswer=0;
    s.quizQuestions[1].userAnswer=3;
    s.quizAttempts=[buildQuizAttempt(s.quizQuestions,"quiz","one",new Date("2026-10-25T00:00:00Z"))];
    const x=getLearningInsights([s]).find(i=>i.name==="Cell biology")!;
    expect(x).toMatchObject({attempted:1,correct:0,errors:1,evidence:"insufficient"});
    expect(pickRescue([s])?.questionId).toBe(s.quizQuestions[0].id);
    expect(diagnoseError("numerical")).toHaveLength(3);
  });
  it("does not double count one active and one saved copy of the same session",()=>{
    const s=createSampleSession("neet","duplicated");
    s.quizQuestions[0].userAnswer=1;
    s.quizAttempts=[buildQuizAttempt(s.quizQuestions,"quiz","attempt")];
    expect(getLearningInsights([s,s]).find(x=>x.name==="Cell biology")?.attempted).toBe(1);
  });
});
describe("exam practice scoring and source constraints",()=>{
  it("requires JEE Main 2026 numeric and MCQ sections",()=>{
    expect(EXAM_SPECS["jee-main"]).toMatchObject({year:2026,totalQuestions:75,mcqPerSubject:20,numericalPerSubject:5});
    expect(EXAM_SPECS["jee-advanced"].correctMarks).toBeNull();
    expect(EXAM_SPECS.neet.totalQuestions).toBe(180);
  });
  it("grades integers with -1 for mistakes and 0 for skips",()=>{
    const q=ORIGINAL_NUMERICAL_ITEMS;
    expect(gradePractice(q,{[q[0].id]:"24",[q[1].id]:"8"})).toMatchObject({correct:1,wrong:1,skipped:1,points:3,maxPoints:12});
    expect(gradePractice(q,{[q[0].id]:"24.0"})).toMatchObject({correct:0,wrong:1});
  });
  it("validates original items but does not claim external expert review",()=>{
    const s=createSampleSession("jee-main","demo");
    expect(inspectOriginalQuestions(s.quizQuestions)).toMatchObject({valid:true,checked:5});
    expect(inspectPracticeItems(ORIGINAL_NUMERICAL_ITEMS)).toMatchObject({valid:true,checked:3});
    const invalid={...s.quizQuestions[0],options:["x","x","y","z"]};
    expect(inspectOriginalQuestions([invalid]).valid).toBe(false);
  });
});
