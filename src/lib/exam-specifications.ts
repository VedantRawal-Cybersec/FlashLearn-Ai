/** Official *reference* formats for 2026. Mini practice never claims to reproduce full papers. */
export type ExamCode = "jee-main" | "neet" | "jee-advanced";
export interface ExamSpec {
  name: string;
  year: number;
  durationMinutes: number;
  totalQuestions: number | null;
  mcqPerSubject?: number;
  numericalPerSubject?: number;
  subjects: string[];
  correctMarks: number | null;
  wrongMarks: number | null;
  officialUrl: string;
  caution: string;
}
export const EXAM_SPECS: Record<ExamCode, ExamSpec> = {
  "jee-main": {
    name:"JEE Main Paper 1", year:2026, durationMinutes:180, totalQuestions:75,
    mcqPerSubject:20, numericalPerSubject:5, subjects:["Physics","Chemistry","Mathematics"],
    correctMarks:4, wrongMarks:-1,
    officialUrl:"https://jeemain.nta.nic.in/information-bulletin/",
    caution:"Official 2026 Paper 1 includes Section A MCQs and Section B numerical-value responses, with negative marking in both.",
  },
  neet: {
    name:"NEET UG",year:2026,durationMinutes:180,totalQuestions:180,mcqPerSubject:45,
    subjects:["Physics","Chemistry","Biology (90 questions)"],
    correctMarks:4, wrongMarks:-1,
    officialUrl:"https://neet.nta.nic.in/admission-bulletin/",
    caution:"Official 2026 exam uses 180 compulsory four-option MCQs across Physics, Chemistry, and Biology.",
  },
  "jee-advanced": {
    name:"JEE Advanced",year:2026,durationMinutes:360,totalQuestions:null,
    subjects:["Physics","Chemistry","Mathematics"],
    correctMarks:null,wrongMarks:null,
    officialUrl:"https://jeeadv.ac.in/",
    caution:"Two compulsory three-hour papers. Question types and marking vary by paper; no one fixed marking formula is valid.",
  },
};
export interface PracticeItem {
  id: string;
  topic: string;
  prompt: string;
  type: "mcq" | "integer";
  options?: string[];
  correctIndex?: number;
  answerInteger?: number;
  explanation: string;
  provenance: "original-demonstration";
}
export const ORIGINAL_NUMERICAL_ITEMS: PracticeItem[] = [
  { id:"jee-num-motion",topic:"Kinematics",prompt:"A vehicle starts from rest and accelerates uniformly at 3 m/s² for 4 seconds. Enter its displacement in metres as an integer.",type:"integer",answerInteger:24,
    explanation:"Displacement s = ut + ½at² = 0 + ½ × 3 × 4² = 24 m.",provenance:"original-demonstration" },
  { id:"jee-num-force",topic:"Newton's laws",prompt:"A net horizontal force of 18 N acts on a 3 kg body. Enter its acceleration in m/s² as an integer.",type:"integer",answerInteger:6,
    explanation:"Newton's second law gives a = F/m = 18/3 = 6 m/s².",provenance:"original-demonstration" },
  { id:"jee-num-resistance",topic:"Current electricity",prompt:"Two resistors of 4 Ω and 8 Ω are connected in series. Enter equivalent resistance in Ω as an integer.",type:"integer",answerInteger:12,
    explanation:"For series resistors R = 4 + 8 = 12 Ω.",provenance:"original-demonstration" },
];
export function gradePractice(items: PracticeItem[], answers: Record<string,string>, correctMarks = 4, wrongMarks = -1) {
  let correct = 0, wrong = 0, skipped = 0;
  for (const item of items) {
    const raw = answers[item.id];
    if (raw === undefined || raw.trim() === "") { skipped++; continue; }
    const valid = item.type === "integer"
      ? /^-?\d+$/.test(raw.trim()) && Number(raw.trim()) === item.answerInteger
      : Number(raw) === item.correctIndex;
    if (valid) correct++; else wrong++;
  }
  return { correct, wrong, skipped, points:correct*correctMarks+wrong*wrongMarks,
    maxPoints:items.length*correctMarks };
}
