import type { QuizQuestion } from "@/lib/store";
export interface WrongAnswer {
  questionId: string; question: string; topic: string;
  selected?: string; correct: string; explanation: string;
}
export interface AnswerEvidence { questionId: string; topic: string; selected?: number; correct: boolean }
export interface QuizAttempt {
  id: string; completedAt: string; kind: "quiz" | "drill";
  attempted: number; correct: number; total: number;
  mistakes: WrongAnswer[];
  responses?: AnswerEvidence[];
}
export function buildQuizAttempt(questions: QuizQuestion[], kind: QuizAttempt["kind"], id: string, now: Date = new Date()): QuizAttempt {
  const attempted = questions.filter(q => q.userAnswer !== undefined).length;
  const correct = questions.filter(q => q.userAnswer === q.correctIndex && q.userAnswer !== undefined).length;
  const mistakes = questions.filter(q => q.userAnswer !== q.correctIndex).map(q => ({
    questionId: q.id,
    question: q.question,
    topic: q.topic || "General",
    selected: q.userAnswer === undefined ? undefined : q.options[q.userAnswer],
    correct: q.options[q.correctIndex],
    explanation: q.explanation || "Review this concept with a trusted source.",
  }));
  const responses = questions.map(q => ({questionId:q.id,topic:q.topic || "General",
    selected:q.userAnswer,correct:q.userAnswer !== undefined && q.userAnswer === q.correctIndex}));
  return { id, completedAt: now.toISOString(), kind, attempted, correct, total: questions.length, mistakes, responses };
}
