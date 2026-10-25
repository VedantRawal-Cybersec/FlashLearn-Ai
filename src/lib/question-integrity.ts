import type { QuizQuestion } from "@/lib/store";
import type { PracticeItem } from "@/lib/exam-specifications";
/** Strict structural checks; cannot establish scientific or mathematical truth. */
export interface IntegrityResult { valid: boolean; issues: string[]; checked: number }
const normalize=(x:string)=>x.trim().toLocaleLowerCase("en").replace(/\s+/g," ");
export function inspectOriginalQuestions(questions: QuizQuestion[]): IntegrityResult {
  const issues:string[]=[];
  const seen=new Set<string>();
  questions.forEach((q,i)=>{
    const label="Question "+(i+1);
    if(!q.question?.trim())issues.push(label+": empty prompt");
    const key=normalize(q.question||"");
    if(seen.has(key))issues.push(label+": repeated prompt");
    seen.add(key);
    if(q.options?.length!==4 || q.options.some(o=>!o.trim()) ||
        new Set((q.options||[]).map(normalize)).size!==4)issues.push(label+": needs four distinct nonempty options");
    if(!Number.isInteger(q.correctIndex)||q.correctIndex<0||q.correctIndex>3)issues.push(label+": invalid answer index");
    if(!q.explanation?.trim())issues.push(label+": missing explanation");
  });
  return {valid:issues.length===0,issues,checked:questions.length};
}
export function inspectPracticeItems(items: PracticeItem[]): IntegrityResult {
  const issues:string[]=[];
  const seen=new Set<string>();
  items.forEach((item,i)=>{
    const name="Practice "+(i+1);
    if(!item.prompt.trim()||!item.explanation.trim())issues.push(name+": missing explanation or prompt");
    const key=normalize(item.prompt);
    if(seen.has(key))issues.push(name+": repeated prompt");
    seen.add(key);
    if(item.provenance!=="original-demonstration")issues.push(name+": unsupported source provenance");
    if(item.type==="integer") {
      if(!Number.isSafeInteger(item.answerInteger))issues.push(name+": integer answer missing or unsafe");
    } else if(!item.options||item.options.length!==4||new Set(item.options.map(normalize)).size!==4||
              item.options.some(o=>!o.trim())||!Number.isInteger(item.correctIndex)||
              item.correctIndex!<0||item.correctIndex!>3)issues.push(name+": invalid multiple choice");
  });
  return {valid:issues.length===0,issues,checked:items.length};
}
