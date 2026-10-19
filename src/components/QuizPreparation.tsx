import type { GenerationInfo } from "@/lib/store";
import { DIFFICULTY_LABELS, EXAM_LABELS } from "../../supabase/functions/_shared/study-options";

export default function QuizPreparation({ generation }: { generation?: GenerationInfo }) {
  if (!generation) return null;
  return <div className="mb-6 text-sm text-muted-foreground space-y-2">
    <p className="text-foreground">{DIFFICULTY_LABELS[generation.options.difficulty]} · {EXAM_LABELS[generation.options.examLevel]} · {generation.options.includeNumericals ? "Numericals requested" : "Conceptual MCQs"}</p>
    {generation.numericalNote && <p role="status">{generation.numericalNote}</p>}
    {generation.examAlignmentNote && <p role="status">{generation.examAlignmentNote}</p>}
    {generation.references.length > 0 && <details>
      <summary className="cursor-pointer text-primary">Exam references · original AI practice</summary>
      <p className="mt-2">Adapted single-correct MCQs, not an official mock or past-paper question bank. Reference editions are listed below.</p>
      <ul className="mt-2 space-y-1">{generation.references.map((r) => <li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{r.title}</a></li>)}</ul>
    </details>}
  </div>;
}