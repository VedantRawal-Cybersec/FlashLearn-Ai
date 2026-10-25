import { describe, expect, it } from "vitest";
import { scheduleReview, isReviewDue } from "@/lib/spaced-repetition";
import { buildQuizAttempt } from "@/lib/quiz-history";
import type { QuizQuestion } from "@/lib/store";
const now = new Date("2026-10-25T09:00:00Z");
describe("persistent spaced review scheduling", () => {
  it("exposes new cards and schedules first Good after one day", () => {
    expect(isReviewDue({}, now)).toBe(true);
    const s = scheduleReview(undefined, "good", now);
    expect(s.intervalDays).toBe(1);
    expect(isReviewDue({ review: s }, now)).toBe(false);
    expect(isReviewDue({ review: s }, new Date("2026-10-26T09:00:00Z"))).toBe(true);
  });
  it("schedules Again after ten minutes and records lapses", () => {
    const next = scheduleReview(scheduleReview(undefined, "good", now), "again", now);
    expect(next.lapses).toBe(1);
    expect(next.repetitions).toBe(0);
    expect(next.dueAt).toBe("2026-10-25T09:10:00.000Z");
  });
  it("increases intervals for repeated successful recall", () => {
    const first = scheduleReview(undefined,"good",now);
    const second = scheduleReview(first,"good",new Date(first.dueAt));
    expect(second.intervalDays).toBe(3);
    const third = scheduleReview(second,"easy",new Date(second.dueAt));
    expect(third.intervalDays).toBeGreaterThan(3);
  });
});
describe("quiz attempt preservation", () => {
  it("records all mistakes and skips without treating unanswered questions as correct", () => {
    const q: QuizQuestion[] = [
      {id:"1",question:"A?",options:["a","b","c","d"],correctIndex:0,userAnswer:0,topic:"A"},
      {id:"2",question:"B?",options:["a","b","c","d"],correctIndex:0,userAnswer:2,topic:"B"},
      {id:"3",question:"C?",options:["a","b","c","d"],correctIndex:0,topic:"C"},
    ];
    const attempt=buildQuizAttempt(q,"drill","history-1",now);
    expect(attempt).toMatchObject({total:3,attempted:2,correct:1});
    expect(attempt.mistakes.map(m=>m.questionId)).toEqual(["2","3"]);
    expect(attempt.mistakes[1].selected).toBeUndefined();
  });
});
