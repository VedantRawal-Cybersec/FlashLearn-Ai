import type { QuizQuestion } from "@/lib/store";

const examples: Record<string, Omit<QuizQuestion,"id">> = {
  "kinematics": {
    topic:"Kinematics",question:"A cyclist starts from rest and accelerates at a constant 4 m/s² for 5 seconds. What displacement does the cyclist cover?",
    options:["20 m","40 m","50 m","100 m"],correctIndex:2,questionType:"numerical",
    explanation:"The displacement is s = ut + ½at² = 0 + ½ × 4 × 25 = 50 m.",
  },
  "current electricity": {
    topic:"Current electricity",question:"Two ideal 5 Ω and 7 Ω resistors are connected in series. What is their equivalent resistance?",
    options:["2 Ω","12 Ω","35 Ω","1.9 Ω"],correctIndex:1,questionType:"numerical",
    explanation:"Series resistance adds: R = 5 Ω + 7 Ω = 12 Ω.",
  },
  "work and energy": {
    topic:"Work and energy",question:"How much work is done lifting a 3 kg object 4 m vertically at constant speed? Use g = 10 m/s².",
    options:["12 J","30 J","60 J","120 J"],correctIndex:3,questionType:"numerical",
    explanation:"At constant speed, upward force is mg = 30 N. Work is F × h = 30 × 4 = 120 J.",
  },
  "ray optics": {
    topic:"Ray optics",question:"For an ideal thin convex lens, an object placed at twice the focal length forms which kind of image?",
    options:["Real, inverted, same size at 2f","Virtual, upright, enlarged","Real, upright, enlarged","No image"],
    correctIndex:0,questionType:"conceptual",
    explanation:"An object at 2f of a converging lens creates a real, inverted image of equal size at 2f on the other side.",
  },
  "mechanics": {
    topic:"Mechanics",question:"What is the linear momentum of a 4 kg object moving at a constant 3 m/s?",
    options:["1.33 kg·m/s","7 kg·m/s","12 kg·m/s","24 kg·m/s"],correctIndex:2,questionType:"numerical",
    explanation:"Linear momentum is p = mv = 4 × 3 = 12 kg·m/s.",
  },
  "cell biology": {
    topic:"Cell biology",question:"During translation, which RNA type delivers amino acids to the ribosome?",
    options:["mRNA","rRNA","tRNA","snRNA"],correctIndex:2,questionType:"conceptual",
    explanation:"Transfer RNA (tRNA) carries specific amino acids and matches anticodons to mRNA codons at the ribosome.",
  },
  "molecular genetics": {
    topic:"Molecular genetics",question:"What is the complementary DNA strand to 5′-GCTA-3′ when the complementary strand is written antiparallel (3′→5′)?",
    options:["3′-CGAT-5′","3′-GCTA-5′","3′-CGAU-5′","3′-TAGC-5′"],correctIndex:0,questionType:"conceptual",
    explanation:"In DNA, G pairs with C, C with G, T with A, A with T. Antiparallel to 5′-GCTA-3′ is 3′-CGAT-5′.",
  },
  "excretory system": {
    topic:"Excretory system",question:"In a human nephron, where does the initial filtration of blood plasma occur?",
    options:["Collecting duct","Glomerulus into Bowman's capsule","Loop of Henle","Ureter"],
    correctIndex:1,questionType:"conceptual",
    explanation:"Glomerular filtration moves water and small solutes from glomerular capillaries into Bowman's space.",
  },
  "plant transport": {
    topic:"Plant transport",question:"Which vascular tissue principally transports sucrose from photosynthetic source leaves toward sink organs?",
    options:["Xylem","Cuticle","Phloem","Cork"],correctIndex:2,questionType:"conceptual",
    explanation:"Phloem transports sugars and other organic solutes from source tissues toward sinks.",
  },
  "cell metabolism": {
    topic:"Cell metabolism",question:"Which reaction commonly supplies immediately usable free energy for cellular work?",
    options:["ATP → ADP + inorganic phosphate","DNA → RNA","Glucose → cellulose","Cholesterol → steroid hormones"],
    correctIndex:0,questionType:"conceptual",
    explanation:"ATP hydrolysis to ADP and inorganic phosphate can be coupled to energetically unfavorable cellular processes.",
  },
};
/** An original second problem for transfer practice, not a licensed PYQ or externally reviewed bank. */
export function makeRescueVariant(topic: string, sessionId: string): QuizQuestion | null {
  const value = examples[topic.trim().toLowerCase()];
  if (!value) return null;
  return { ...value, options:[...value.options], id:sessionId+"-rescue-variant-"+topic.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-") };
}
export function getRescueVariantTopics(): string[] { return Object.keys(examples); }
