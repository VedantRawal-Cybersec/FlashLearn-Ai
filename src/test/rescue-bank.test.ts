import { describe,it,expect } from "vitest";
import { createSampleSession } from "@/lib/demo-session";
import { makeRescueVariant,getRescueVariantTopics } from "@/lib/rescue-bank";
import { inspectOriginalQuestions } from "@/lib/question-integrity";
describe("original transfer practice",()=>{
  it("supplies a distinct valid variant for each demonstrated concept",()=>{
    for(const track of ["jee-main","neet"] as const) {
      const session=createSampleSession(track,"fixture");
      for(const q of session.quizQuestions) {
        const alternate=makeRescueVariant(q.topic||"",session.id);
        expect(alternate?.question).toBeTruthy();
        expect(alternate?.question).not.toBe(q.question);
        expect(alternate?.options).toHaveLength(4);
        expect(inspectOriginalQuestions([alternate!]).valid).toBe(true);
      }
    }
    expect(getRescueVariantTopics()).toHaveLength(10);
  });
  it("does not invent an unknown topic",()=>{
    expect(makeRescueVariant("Advanced astrophysics","fixture")).toBeNull();
  });
});
