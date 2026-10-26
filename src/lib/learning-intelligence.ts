import type { StudySession } from "@/lib/store";
import { isReviewDue } from "@/lib/spaced-repetition";
import type { WrongAnswer } from "@/lib/quiz-history";

export type EvidenceLevel = "insufficient" | "emerging" | "repeated";
export interface ConceptInsight {
  name: string;
  attempted: number;
  correct: number;
  errors: number;
  dueCards: number;
  evidence: EvidenceLevel;
  accuracy: number | null;
  priority: number;
  mistakes: WrongAnswer[];
}
export function getLearningInsights(sessions: StudySession[], now = new Date()): ConceptInsight[] {
  const groups = new Map<string, ConceptInsight>();
  const unique = sessions.filter((s, i, all) => all.findIndex(item => item.id === s.id) === i);
  const group = (raw: string) => {
    const name = raw.trim() || "Unclassified";
    const key = name.toLocaleLowerCase("en");
    if (!groups.has(key)) groups.set(key, {
      name, attempted: 0, correct: 0, errors: 0, dueCards: 0,
      evidence: "insufficient", accuracy: null, priority: 0, mistakes: [],
    });
    return groups.get(key)!;
  };
  for (const session of unique) {
    const fallback = session.generation?.options.chapter || session.title;
    const attempts = session.quizAttempts || [];
    for (const attempt of attempts) {
      if (attempt.responses?.length) {
        for (const response of attempt.responses) {
          const item = group(response.topic || fallback);
          if (response.selected !== undefined) {
            item.attempted++;
            if (response.correct) item.correct++;
            else item.errors++;
          } else item.errors++;
        }
      } else {
        // Legacy history has mistakes but not per-topic correct attempts.
        // Count observed mistakes, without inventing correct-topic evidence.
        for (const mistake of attempt.mistakes) group(mistake.topic || fallback).errors++;
      }
      for (const mistake of attempt.mistakes) {
        const item = group(mistake.topic || fallback);
        if (item.mistakes.length < 15) item.mistakes.push(mistake);
      }
    }
    for (const card of session.flashcards) {
      const matchingQuestion = session.quizQuestions.find(q =>
        q.topic && (card.front.toLowerCase().includes(q.topic.toLowerCase()) || q.question.toLowerCase().includes(card.front.toLowerCase()))
      );
      const item = group(matchingQuestion?.topic || fallback);
      if (isReviewDue(card, now)) item.dueCards++;
    }
  }
  for (const item of groups.values()) {
    item.accuracy = item.attempted ? Math.round(item.correct / item.attempted * 100) : null;
    item.evidence = item.attempted >= 6 ? "repeated" : item.attempted >= 3 ? "emerging" : "insufficient";
    item.priority = item.errors * 4 + item.dueCards * 2 + (item.attempted ? Math.round((1 - item.correct / item.attempted) * 5) : 0);
  }
  return [...groups.values()].sort((a,b) => b.priority - a.priority || a.name.localeCompare(b.name));
}
export function pickRescue(sessions: StudySession[]): { concept: ConceptInsight; sessionId: string; questionId: string } | null {
  const concepts = getLearningInsights(sessions).filter(c => c.mistakes.length);
  for (const concept of concepts) {
    const wrongIds = new Set(concept.mistakes.map(m => m.questionId));
    const found = sessions.flatMap(s => [...s.quizQuestions,...(s.practiceQuestions||[])].map(q => ({ s, q })))
      .find(({ q }) => wrongIds.has(q.id));
    if (found) return { concept, sessionId: found.s.id, questionId: found.q.id };
  }
  return null;
}
export function diagnoseError(questionType: "conceptual" | "numerical" | undefined) {
  return questionType === "numerical"
    ? ["List each given value with its units.", "Write the relevant equation and isolate the unknown.", "Substitute carefully and check the final unit."]
    : ["State the tested concept in your own words.", "Predict an answer before reading the options.", "Eliminate distractors by finding the precise contradicting detail."];
}
