import { describe, expect, it } from "vitest";
import { chooseOpponentAnswer } from "@/lib/battle";
import { QuizQuestion } from "@/lib/store";

const question: QuizQuestion = { id: "q", question: "2 + 2?", options: ["3", "4", "5"], correctIndex: 1 };
describe("AI duel opponent", () => {
  it("chooses the correct answer inside the difficulty accuracy threshold", () => {
    expect(chooseOpponentAnswer(question, "master", .8)).toBe(1);
    expect(chooseOpponentAnswer(question, "apprentice", .2)).toBe(1);
  });
  it("selects a valid wrong answer outside the threshold", () => {
    expect(chooseOpponentAnswer(question, "apprentice", .8, 0)).toBe(0);
    expect(chooseOpponentAnswer(question, "scholar", .95, .8)).toBe(2);
  });
});