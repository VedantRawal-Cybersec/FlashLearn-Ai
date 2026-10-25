import type { StudySession } from "@/lib/store";
type Raw = Record<string, unknown>;
const object = (value: unknown): value is Raw => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = 2000): value is string => typeof value === "string" && value.length <= max;
export function validateStudyBackup(raw: unknown): StudySession[] {
  if (!object(raw) || raw.version !== 1 || !Array.isArray(raw.sessions) || raw.sessions.length > 100)
    throw new Error("Not a supported Flash Learn backup (version 1, max 100 sessions).");
  const ids = new Set<string>();
  for (const session of raw.sessions as unknown[]) {
    if (!object(session) || !text(session.id, 100) || session.id.length === 0 || ids.has(session.id) ||
        !text(session.title, 500) || !text(session.createdAt, 100) || !text(session.videoUrl, 2000) ||
        !Array.isArray(session.flashcards) || session.flashcards.length > 1000 ||
        !Array.isArray(session.quizQuestions) || session.quizQuestions.length > 1000 ||
        !Array.isArray(session.roadmap) || session.roadmap.length > 1000)
      throw new Error("Backup has an invalid session or duplicate session ID.");
    ids.add(session.id);
    for (const c of session.flashcards) {
      if (!object(c) || !text(c.id,100) || !text(c.front,10000) || !text(c.back,15000) ||
          (c.difficulty !== null && !["easy","medium","hard"].includes(c.difficulty as string)) ||
          (c.review !== undefined && (!object(c.review) || !text(c.review.dueAt,100) || !text(c.review.lastReviewedAt,100) ||
             typeof c.review.intervalDays !== "number" || !Number.isFinite(c.review.intervalDays) || typeof c.review.repetitions !== "number" || !Number.isFinite(c.review.repetitions))))
        throw new Error("Backup contains an invalid flashcard.");
    }
    for (const q of session.quizQuestions) {
      if (!object(q) || !text(q.id,100) || !text(q.question,10000) ||
        !Array.isArray(q.options) || q.options.length !== 4 || !q.options.every((o:unknown)=>text(o,5000)) ||
        typeof q.correctIndex !== "number" || !Number.isInteger(q.correctIndex) || (q.correctIndex as number) < 0 || (q.correctIndex as number) > 3 ||
        (q.userAnswer !== undefined && (typeof q.userAnswer !== "number" || !Number.isInteger(q.userAnswer) || (q.userAnswer as number)<0 || (q.userAnswer as number)>3)))
        throw new Error("Backup contains an invalid question.");
    }
    for (const item of session.roadmap) {
      if (!object(item) || !text(item.id,100) || !text(item.title,1000) || !text(item.description,10000) || typeof item.completed!=="boolean")
        throw new Error("Backup contains an invalid roadmap item.");
    }
  }
  return raw.sessions as StudySession[];
}
