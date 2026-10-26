import {describe,it,expect} from "vitest";
import {createSampleSession} from "@/lib/demo-session";
import {buildQuizAttempt} from "@/lib/quiz-history";
import {buildLearningMetrics,metricsCsv} from "@/lib/learning-metrics";
describe("private real-data learning analytics",()=>{
  it("counts only saved attempts and avoids duplicate active/saved sessions",()=>{
    const s=createSampleSession("neet","unit");
    s.quizQuestions[0].userAnswer=1;
    s.quizQuestions[1].userAnswer=0;
    s.quizAttempts=[buildQuizAttempt(s.quizQuestions,"quiz","one",new Date("2026-10-22T12:00:00Z"))];
    const m=buildLearningMetrics([s,s],new Date("2026-10-24T12:00:00Z"));
    expect(m).toMatchObject({totalSessions:1,attempts:1,answered:2,correct:1,accuracy:50,activeDays:1});
    expect(metricsCsv(m)).toContain("2026-10-22,1,2,1,1,3");
  });
  it("does not invent an accuracy score for new students",()=>{
    expect(buildLearningMetrics([])).toMatchObject({accuracy:null,attempts:0,activeDays:0});
  });
});
