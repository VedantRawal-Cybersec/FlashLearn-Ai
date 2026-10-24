import { describe, it, expect } from "vitest";
import { createSampleSession } from "@/lib/demo-session";
describe("instant JEE/NEET demo activation", () => {
  for (const track of ["jee-main", "neet"] as const) {
    it(`creates correctly structured local ${track} study content`, () => {
      const s = createSampleSession(track, "fixture");
      expect(s.quizQuestions).toHaveLength(5);
      expect(s.flashcards).toHaveLength(5);
      expect(s.generation?.options.examLevel).toBe(track);
      expect(s.quizQuestions.every(q => q.options.length === 4 && q.correctIndex >= 0 && q.correctIndex < 4)).toBe(true);
      expect(new Set(s.quizQuestions.map(q => q.question))).toHaveProperty("size", 5);
      expect(s.generation?.examAlignmentNote).toContain("not official");
    });
  }
  it("uses distinct IDs for repeated demos", () => {
    expect(createSampleSession("neet", "a").quizQuestions[0].id).not.toBe(createSampleSession("neet", "b").quizQuestions[0].id);
  });
});
