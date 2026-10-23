import { describe, expect, it } from "vitest";
import { parseStudyOptions, buildStudyOptionsPrompt, validateQuizQuestions, DIFFICULTIES, EXAM_LEVELS } from "../../supabase/functions/_shared/study-options";

describe("study generation options", () => {
  it("rejects exam-subject mismatch", () => { expect(() => parseStudyOptions({ examLevel: "neet", subject: "mathematics" })).toThrow(); expect(() => parseStudyOptions({ examLevel: "jee-main", subject: "biology" })).toThrow(); });
  it("supports Karnataka exams and requested chapter", () => { const options = parseStudyOptions({ examLevel: "kcet", subject: "physics", chapter: "Optics" }); expect(buildStudyOptionsPrompt(options)).toContain("Optics"); });
  it.each(DIFFICULTIES)("accepts %s difficulty and includes it in generation", (difficulty) => {
    const options = parseStudyOptions({ difficulty });
    expect(options.difficulty).toBe(difficulty);
    expect(buildStudyOptionsPrompt(options)).toContain(`Difficulty: ${difficulty[0].toUpperCase()}${difficulty.slice(1)}`);
  });
  it.each(EXAM_LEVELS)("preserves the %s exam target", (examLevel) => {
    expect(parseStudyOptions({ examLevel }).examLevel).toBe(examLevel);
  });
  it("explicitly disables numerical calculations when not requested", () => {
    expect(buildStudyOptionsPrompt(parseStudyOptions({ includeNumericals: false }))).toContain("Do not include numerical calculation questions");
  });
  it("requests numericals with worked solutions when enabled", () => {
    expect(buildStudyOptionsPrompt(parseStudyOptions({ includeNumericals: true, questionCount: 12 }))).toContain("Include at least 4 numerical calculation MCQs");
  });
  it("honors the chosen number of MCQs", () => {
    expect(buildStudyOptionsPrompt(parseStudyOptions({ questionCount: 5 }))).toContain("exactly 5 quiz questions");
    expect(() => parseStudyOptions({ questionCount: 51 })).toThrow();
    expect(() => parseStudyOptions({ questionCount: 4 })).toThrow();
  });
  it("rejects invalid option values", () => {
    expect(() => parseStudyOptions({ difficulty: "impossible" })).toThrow();
    expect(() => parseStudyOptions({ examLevel: "fake-exam" })).toThrow();
    expect(() => parseStudyOptions({ includeNumericals: "false" })).toThrow();
  });
  it("rejects malformed, miscounted or unwanted numerical questions", () => {
    const options = parseStudyOptions({ questionCount: 5 });
    const q = { question: "A concept?", options: ["A", "B", "C", "D"], correctIndex: 1, explanation: "B follows from the concept.", questionType: "conceptual" };
    expect(() => validateQuizQuestions(Array(5).fill(q), options)).not.toThrow();
    expect(() => validateQuizQuestions(Array(4).fill(q), options)).toThrow();
    expect(() => validateQuizQuestions(Array(5).fill({ ...q, correctIndex: 4 }), options)).toThrow();
    expect(() => validateQuizQuestions(Array(5).fill({ ...q, questionType: "numerical" }), options)).toThrow();
  });
});