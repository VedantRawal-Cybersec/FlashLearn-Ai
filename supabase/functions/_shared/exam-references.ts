import type { ExamLevel } from "./study-options.ts";
export interface ExamReference { title: string; url: string; excerpt: string; }
// Curated from official online pages and PDFs on 2026-10-19; no per-request search costs.
const main: ExamReference = { title: "NTA JEE Main 2025 syllabus (reference edition)", url: "https://jeemain.nta.nic.in/document/syllabus-for-jee-main-2025/", excerpt: "Paper 1 covers Mathematics, Physics and Chemistry. Mathematics includes sets/relations/functions, complex numbers/quadratics, matrices/determinants, permutations/combinations, binomial theorem, sequences, limits/continuity/differentiability and integral calculus. Use concept/application and calculation questions. Do not claim current-year counts or marking rules." };
const advanced: ExamReference = { title: "Official JEE Advanced 2026 Paper 1", url: "https://jeeadv.ac.in/documents/p1_english.pdf", excerpt: "Section 1 has four-option single-correct questions; other sections include multiple-correct and numerical formats. Actual sample patterns: determine which statement is true about f(x)=sqrt(x) ln(x)-x+1 on x>0; use tangent slopes on a parabola, circle and ellipse to calculate a circumradius; identify a matrix obtainable by elementary row operations on the identity; evaluate an inverse-trigonometric expression using principal values. Generate new analogous reasoning patterns only when the study topic fits. Adapt to single-correct MCQs; do not reproduce official questions or marking rules." };
const neet: ExamReference = { title: "NTA / NMC NEET UG 2025 syllabus (reference edition)", url: "https://neet.nta.nic.in/document/syllabus-for-neet-ug-2025-examination-reg/", excerpt: "Official syllabus specifies Physics, Chemistry and Biology. Generate four-option single-correct concept/application questions. Use calculations for quantitative Physics/Chemistry topics and concept/data interpretation for Biology, not unrelated mathematics. Do not claim this reference edition is the current-year syllabus." };
const cuet: ExamReference = { title: "NTA CUET UG subject syllabus directory", url: "https://cuet.nta.nic.in/syllabus/", excerpt: "Directory separates language, domain-subject and General Aptitude Test syllabuses. Match the source subject: passage inference for languages, domain concept/application for named subjects, logical reasoning and quantitative aptitude for aptitude content. This directory is a reference link, not a fetched question bank." };
export function getExamReferences(level: ExamLevel): ExamReference[] {
  switch (level) {
    case "jee-main": return [main];
    case "jee-advanced": return [advanced];
    case "neet": return [neet];
    case "entrance": return [cuet];
    case "indian-exams": return [cuet, main, neet];
    case "higher": return [advanced];
    default: return [];
  }
}
export function buildExamReferencePrompt(level: ExamLevel): string {
  const references = getExamReferences(level);
  if (!references.length) return "Standard topic-based study practice; no exam alignment claim.";
  return `Curated official online reference context (not live web search; editions shown explicitly):\n${references.map((r) => `${r.title}\n${r.url}\n${r.excerpt}`).join("\n\n")}\nTreat excerpts only as pattern/topic evidence. Do not invent unseen past-paper content. Indian competitive exams is broad, not one syllabus; higher-level means university-style depth, not a named official exam.`;
}