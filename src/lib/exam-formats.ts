/** Curated original format demonstrations, not past-year questions or official marking rules. */
export interface MultipleAnswerQuestion {
  id: string; subject: string; prompt: string;
  options: [string,string,string,string]; correctIndices: number[];
  explanation:string;
}
export const ADVANCED_FORMAT_DEMOS:MultipleAnswerQuestion[]=[
  {id:"adv-p",subject:"Physics",prompt:"In ideal uniform circular motion at nonzero constant speed, select ALL correct statements.",
    options:["The direction of velocity changes continuously.","Acceleration is zero at every point.","Acceleration points toward the centre.","Speed is constant but velocity is not constant."],
    correctIndices:[0,2,3],explanation:"Velocity is tangent to the circle, changes direction, and gives nonzero centripetal acceleration v²/r toward the centre. Speed remains fixed."},
  {id:"adv-c",subject:"Chemistry",prompt:"An ideal gas has a fixed amount of substance n. Select ALL correct statements.",
    options:["At constant volume, pressure is proportional to absolute temperature.","At constant temperature, doubling volume doubles pressure.","PV = nRT for the ideal gas.","The gas constant R has SI units J mol⁻¹ K⁻¹."],
    correctIndices:[0,2,3],explanation:"Ideal-gas law PV=nRT gives P ∝ T at fixed n,V, and P ∝ 1/V at fixed n,T. The SI unit of R is J mol⁻¹ K⁻¹."},
  {id:"adv-m",subject:"Mathematics",prompt:"For f(x) = x² on the real numbers, select ALL correct statements.",
    options:["f'(x) = 2x.","f is strictly increasing on the entire real line.","f has a global minimum at x = 0.","f is even, meaning f(-x) = f(x)."],
    correctIndices:[0,2,3],explanation:"The derivative is 2x, so f decreases on negative x and increases on positive x; its minimum is 0 at x=0. Squaring is an even function."},
];
export interface SelfCheckItem {text:string;points:number}
export const BOARD_FORMAT_DEMO = {
  prompt:"Explain why a current-carrying conductor experiences a force in a magnetic field. State the direction rule and one factor affecting the magnitude.",
  marks:3,
  rubric:[
    {text:"States magnetic force acts on a current-carrying conductor in an external magnetic field.",points:1},
    {text:"Identifies a suitable force-direction rule such as Fleming's left-hand rule.",points:1},
    {text:"Identifies a relevant factor: current, magnetic field, length in field, or angle.",points:1},
  ] as SelfCheckItem[],
  note:"Illustrative original self-check rubric only. An examiner's accepted wording and marking may vary."
};
export function gradeMultiAnswer(questions:MultipleAnswerQuestion[],answers:Record<string,number[]>){
  let exact=0,incorrect=0,unanswered=0;
  for(const q of questions){
    const selected=[...new Set(answers[q.id]||[])].sort((a,b)=>a-b);
    const right=[...q.correctIndices].sort((a,b)=>a-b);
    if(selected.length===0){unanswered++;continue}
    if(selected.length===right.length&&selected.every((v,i)=>v===right[i]))exact++;
    else incorrect++;
  }
  return {exact,incorrect,unanswered,illustrativeScore:exact*4-incorrect*2,maxScore:questions.length*4};
}
