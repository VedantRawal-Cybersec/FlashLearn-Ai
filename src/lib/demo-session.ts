import type { StudySession, QuizQuestion, Flashcard } from "@/lib/store";
import { DEFAULT_STUDY_OPTIONS } from "../../supabase/functions/_shared/study-options";

export type SampleTrack = "jee-main" | "neet";

interface SampleQuestion {
  prompt: string;
  choices: [string, string, string, string];
  correct: number;
  explanation: string;
  concept: string;
  numerical?: boolean;
}

const physicsQuestions: SampleQuestion[] = [
  {
    prompt: "A body starts from rest and accelerates uniformly at 2 m/s² for 3 s. How far does it travel?",
    choices: ["3 m", "6 m", "9 m", "18 m"], correct: 2,
    explanation: "s = ut + ½at². Starting from rest, u = 0, so s = ½ × 2 × 3² = 9 m.",
    concept: "Kinematics", numerical: true,
  },
  {
    prompt: "Two resistors of 6 Ω and 3 Ω are connected in series. What is their equivalent resistance?",
    choices: ["2 Ω", "3 Ω", "6 Ω", "9 Ω"], correct: 3,
    explanation: "For series resistors the equivalent resistance is the sum: R = 6 Ω + 3 Ω = 9 Ω.",
    concept: "Current electricity", numerical: true,
  },
  {
    prompt: "A 2 kg object is lifted vertically by 5 m at constant speed. Taking g = 10 m/s², how much work is done by the lifting force?",
    choices: ["10 J", "50 J", "100 J", "200 J"], correct: 2,
    explanation: "At constant speed the upward force is mg = 2 × 10 = 20 N. Work = force × height = 20 × 5 = 100 J.",
    concept: "Work and energy", numerical: true,
  },
  {
    prompt: "In an ideal thin convex lens, paraxial rays parallel to the principal axis converge at which location?",
    choices: ["Optical centre", "Principal focus", "Centre of curvature", "Twice the focal length"], correct: 1,
    explanation: "For paraxial parallel rays, a converging (convex) lens brings the rays together at its principal focus.",
    concept: "Ray optics",
  },
  {
    prompt: "Which is the SI unit of linear momentum?",
    choices: ["newton", "kg·m/s", "joule", "watt"], correct: 1,
    explanation: "Linear momentum p = mv. Mass uses kg and velocity uses m/s, giving kg·m/s.",
    concept: "Mechanics",
  },
];

const biologyQuestions: SampleQuestion[] = [
  {
    prompt: "Which cell structures translate messenger RNA to synthesize proteins?",
    choices: ["Lysosomes", "Ribosomes", "Centrioles", "Peroxisomes"], correct: 1,
    explanation: "Ribosomes read the codons in mRNA and assemble amino acids into a polypeptide.",
    concept: "Cell biology",
  },
  {
    prompt: "In the standard Watson–Crick DNA base-pairing model, adenine pairs with which base?",
    choices: ["Uracil", "Cytosine", "Guanine", "Thymine"], correct: 3,
    explanation: "In DNA, adenine forms two hydrogen bonds with thymine. Uracil replaces thymine in RNA.",
    concept: "Molecular genetics",
  },
  {
    prompt: "What is the structural and functional unit of the human kidney?",
    choices: ["Nephron", "Alveolus", "Neuron", "Hepatocyte"], correct: 0,
    explanation: "The nephron performs filtration, reabsorption, secretion, and urine formation in the kidney.",
    concept: "Excretory system",
  },
  {
    prompt: "Which plant tissue primarily conducts water and dissolved mineral ions from roots toward shoots?",
    choices: ["Phloem", "Epidermis", "Xylem", "Collenchyma"], correct: 2,
    explanation: "Xylem conducts water and dissolved minerals, chiefly upward from roots to aerial parts.",
    concept: "Plant transport",
  },
  {
    prompt: "Which molecule acts as the main immediate energy currency in cells?",
    choices: ["DNA", "ATP", "Cellulose", "Cholesterol"], correct: 1,
    explanation: "Adenosine triphosphate (ATP) transfers usable chemical energy to cellular reactions.",
    concept: "Cell metabolism",
  },
];

const flashcards: Record<SampleTrack, [string, string][]> = {
  "jee-main": [
    ["Displacement under constant acceleration", "s = ut + ½at² (with consistent SI units)"],
    ["Resistors in series", "Rₑq = R₁ + R₂ + ⋯"],
    ["Gravitational potential energy near Earth's surface", "ΔU = mgh for approximately constant g"],
    ["Principal focus of a convex lens", "Point where rays parallel to the principal axis meet in the paraxial approximation"],
    ["Linear momentum", "p = mv, SI unit kg·m/s"],
  ],
  neet: [
    ["Ribosome", "Site of translation: amino acids are assembled using an mRNA template"],
    ["DNA complementary base pairing", "A–T and G–C in canonical double-stranded DNA"],
    ["Nephron", "Structural and functional unit of the kidney"],
    ["Xylem", "Conducts water and dissolved minerals through the plant"],
    ["ATP", "Major immediately usable cellular energy-transfer molecule"],
  ],
};

/**
 * Hand-authored, freely usable demonstration content.
 * Does not call AI, claim official past-paper status, or access the student's account.
 */
export function createSampleSession(track: SampleTrack, id: string = crypto.randomUUID()): StudySession {
  const isJee = track === "jee-main";
  const selected = isJee ? physicsQuestions : biologyQuestions;
  const quizQuestions: QuizQuestion[] = selected.map((q, i) => ({
    id: `${id}-q-${i}`,
    question: q.prompt,
    options: [...q.choices],
    correctIndex: q.correct,
    explanation: q.explanation,
    topic: q.concept,
    questionType: q.numerical ? "numerical" : "conceptual",
  }));
  const cards: Flashcard[] = flashcards[track].map(([front, back], i) => ({
    id: `${id}-c-${i}`, front, back, difficulty: null,
  }));
  return {
    id, videoUrl: "",
    title: isJee ? "SAMPLE · JEE Main Physics" : "SAMPLE · NEET Biology",
    createdAt: new Date().toISOString(),
    flashcards: cards,
    quizQuestions,
    roadmap: [
      { id: `${id}-r-1`, title: "Try your first five questions", description: "Practise original, hand-authored sample questions.", completed: false },
      { id: `${id}-r-2`, title: "Review the explanations", description: "Inspect why each answer is correct.", completed: false },
      { id: `${id}-r-3`, title: "Review your flashcards", description: "Revisit the concepts you missed.", completed: false },
    ],
    generation: {
      options: {
        ...DEFAULT_STUDY_OPTIONS, examLevel: track, subject: isJee ? "physics" : "biology",
        chapter: isJee ? "Physics fundamentals" : "Biology fundamentals",
        questionCount: selected.length, includeNumericals: isJee,
      },
      references: [],
      examAlignmentNote: "Product demo: original sample questions, not official past-year questions or an authentic full-length exam simulation.",
    },
  };
}
