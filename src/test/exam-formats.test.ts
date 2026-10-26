import {describe,it,expect} from "vitest";
import {ADVANCED_FORMAT_DEMOS,BOARD_FORMAT_DEMO,gradeMultiAnswer} from "@/lib/exam-formats";
describe("advanced format demonstrations",()=>{
 it("scores exact matches, skips and errors with explicitly illustrative rules",()=>{
  const q=ADVANCED_FORMAT_DEMOS;
  expect(gradeMultiAnswer(q,{[q[0].id]:[3,0,2],[q[1].id]:[1]})).toEqual({
    exact:1,incorrect:1,unanswered:1,illustrativeScore:2,maxScore:12,
  });
 });
 it("contains unique statements, explanations and checked self-assessment criteria",()=>{
   for(const q of ADVANCED_FORMAT_DEMOS){
     expect(new Set(q.options)).toHaveProperty("size",4);
     expect(q.correctIndices.length).toBeGreaterThan(1);
     expect(q.explanation.length).toBeGreaterThan(40);
   }
   expect(BOARD_FORMAT_DEMO.rubric.reduce((a,b)=>a+b.points,0)).toBe(BOARD_FORMAT_DEMO.marks);
 });
});
