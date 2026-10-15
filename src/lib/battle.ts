import { QuizQuestion } from "@/lib/store";
export type BattleDifficulty = "apprentice" | "scholar" | "master";
export const opponentAccuracy: Record<BattleDifficulty, number> = { apprentice: .45, scholar: .7, master: .9 };
export function chooseOpponentAnswer(question: QuizQuestion, difficulty: BattleDifficulty, roll = Math.random(), wrongRoll = Math.random()) {
  if (roll < opponentAccuracy[difficulty]) return question.correctIndex;
  const wrong = question.options.map((_, i) => i).filter((i) => i !== question.correctIndex);
  return wrong[Math.floor(wrongRoll * wrong.length)] ?? question.correctIndex;
}