export const DIFFICULTIES = ["easy", "medium", "hard", "advanced"] as const;
export const EXAM_LEVELS = ["standard", "entrance", "jee-main", "jee-advanced", "neet", "kcet", "cbse-board", "karnataka-puc", "state-boards", "indian-exams", "higher"] as const;
export type Difficulty = typeof DIFFICULTIES[number];
export type ExamLevel = typeof EXAM_LEVELS[number];
export const SUBJECTS = ["auto", "physics", "chemistry", "mathematics", "biology", "other"] as const;
export type Subject = typeof SUBJECTS[number];
export interface StudyOptions {
  difficulty: Difficulty;
  examLevel: ExamLevel;
  includeNumericals: boolean;
  questionCount: number;
  subject?: Subject;
  chapter?: string;
}
export const DEFAULT_STUDY_OPTIONS: StudyOptions = { difficulty: "medium", examLevel: "standard", includeNumericals: false, questionCount: 20, subject: "auto", chapter: "" };
export const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard", advanced: "Advanced" };
export const EXAM_LABELS: Record<ExamLevel, string> = {
  standard: "Standard study", entrance: "CUET UG", "jee-main": "JEE Main", "jee-advanced": "JEE Advanced", neet: "NEET UG", kcet: "Karnataka KCET", "cbse-board": "CBSE XI/XII", "karnataka-puc": "Karnataka PUC", "state-boards": "State board topic practice", "indian-exams": "Indian competitive exams", higher: "Higher-level / university",
};
export const SUBJECT_LABELS: Record<Subject, string> = { auto: "Detect from lesson", physics: "Physics", chemistry: "Chemistry", mathematics: "Mathematics", biology: "Biology", other: "Other" };
export function parseStudyOptions(input: Record<string, unknown>): StudyOptions {
  const difficulty = input.difficulty ?? "medium";
  const subject = input.subject ?? "auto";
  const chapter = input.chapter ?? "";
  const examLevel = input.examLevel ?? "standard";
  const includeNumericals = input.includeNumericals ?? false;
  const questionCount = input.questionCount ?? 20;
  if (!DIFFICULTIES.some((d) => d === difficulty)) throw new Error("Choose Easy, Medium, Hard or Advanced difficulty.");
  if (!EXAM_LEVELS.some((e) => e === examLevel)) throw new Error("Choose a valid examination level.");
  if (!SUBJECTS.some(v => v === subject)) throw new Error("Choose a valid subject.");
  if (typeof chapter !== "string" || chapter.length > 100) throw new Error("Chapter must be under 100 characters.");
  if (examLevel === "neet" && subject === "mathematics") throw new Error("NEET UG excludes mathematics.");
  if ((examLevel === "jee-main" || examLevel === "jee-advanced") && subject === "biology") throw new Error("JEE Paper 1 excludes biology.");
  if (typeof includeNumericals !== "boolean") throw new Error("Choose whether to include numerical questions.");
  if (typeof questionCount !== "number" || !Number.isInteger(questionCount) || questionCount < 5 || questionCount > 50) throw new Error("Choose between 5 and 50 questions.");
  return { difficulty: difficulty as Difficulty, examLevel: examLevel as ExamLevel, includeNumericals, questionCount, subject: subject as Subject, chapter: chapter.trim() };
}
export function buildStudyOptionsPrompt(options: StudyOptions): string {
  const demands: Record<Difficulty, string> = {
    easy: "Direct recall and single-step understanding, straightforward distractors.",
    medium: "Conceptual application and one or two reasoning steps, plausible distractors.",
    hard: "Multi-step application, connected concepts and challenging distractors.",
    advanced: "Deep synthesis, unfamiliar applications and rigorous multi-step reasoning; no ambiguity or unsolvable tricks.",
  };
  return `Generate exactly ${options.questionCount} quiz questions, 10 flashcards and 6 roadmap steps.
Difficulty: ${DIFFICULTY_LABELS[options.difficulty]}. ${demands[options.difficulty]}
Preparation target: ${EXAM_LABELS[options.examLevel]}. Difficulty is relative to this target.\nSubject: ${SUBJECT_LABELS[options.subject || "auto"]}. ${options.chapter ? `Requested chapter: "${options.chapter}". If the lesson is unrelated, state this in examAlignmentNote.` : "Infer chapter from source."}
${options.includeNumericals ? `Include at least ${Math.ceil(options.questionCount / 3)} numerical calculation MCQs where the source topic supports quantitative reasoning. Supply all necessary values, units and assumptions. Each must have a fully worked calculation in its explanation. Do not invent unrelated numericals; if the topic cannot support them, explain this in numericalNote and generate conceptual questions instead.` : "Do not include numerical calculation questions; generate conceptual MCQs only. numericalNote must be empty."}
All questions must have exactly four distinct options and exactly one correct answer (correctIndex 0–3). Even for JEE numerical or multiple-correct patterns, adapt to SINGLE-CORRECT four-option MCQs, not an exact exam-format mock. Include questionType as conceptual or numerical and a short topic identifying the examined concept.
Explain the correct answer, why each distractor is wrong, and worked steps for numericals. Check calculations independently before finalizing.
Stay aligned with the uploaded content/video topic. If it is outside the selected exam syllabus, set examAlignmentNote to a clear warning and use topic-based practice rather than claiming exam alignment.
These are ORIGINAL AI-generated practice questions, not official or retrieved past-paper questions. Never fabricate citations, exam years or question numbers.`;
}
export function validateQuizQuestions(questions: unknown, options: StudyOptions) {
  if (!Array.isArray(questions) || questions.length !== options.questionCount) throw new Error("The generated question count did not match your selection. Please start a new request.");
  const seen = new Set<string>();
  for (const q of questions) {
    if (!q || typeof q.question !== "string" || !q.question.trim() || !Array.isArray(q.options) || q.options.length !== 4 || q.options.some((v: unknown) => typeof v !== "string" || !v.trim()) || new Set(q.options.map((v: string) => v.trim().toLowerCase())).size !== 4 || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3 || typeof q.explanation !== "string" || !q.explanation.trim() || !["conceptual", "numerical"].includes(q.questionType)) throw new Error("The AI returned an invalid question. Please start a new request.");
    const normalized = q.question.trim().toLowerCase().replace(/\s+/g," ");
    if (seen.has(normalized)) throw new Error("The AI generated duplicate questions; please try again.");
    seen.add(normalized);
    if (!options.includeNumericals && q.questionType === "numerical") throw new Error("The AI returned numericals despite your selection. Please start a new request.");
  }
}