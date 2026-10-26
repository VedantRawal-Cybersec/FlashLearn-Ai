import { create } from 'zustand';
import type { StudyOptions } from '../../supabase/functions/_shared/study-options';
import { scheduleReview, type ReviewSchedule, type ReviewRating } from "@/lib/spaced-repetition";
import { buildQuizAttempt, type QuizAttempt } from "@/lib/quiz-history";
import { validateStudyBackup } from "@/lib/study-backup";

export interface GenerationInfo {
  options: StudyOptions;
  references: { title: string; url: string; excerpt: string }[];
  numericalNote?: string;
  examAlignmentNote?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  review?: ReviewSchedule;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  userAnswer?: number;
  questionType?: 'conceptual' | 'numerical';
  topic?: string;
  generation?: GenerationInfo;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface StudySession {
  id: string;
  title: string;
  videoUrl: string;
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  practiceQuestions?: QuizQuestion[];
  roadmap: RoadmapItem[];
  createdAt: string;
  generation?: GenerationInfo;
  sourceContext?: { kind: "youtube-captions" | "uploaded-document"; text: string; truncated: boolean };
  quizAttempts?: QuizAttempt[];
  questionReports?: { id: string; questionId: string; reason: string; createdAt: string }[];
}

interface AppState {
  currentSession: StudySession | null;
  sessions: StudySession[];
  isLoading: boolean;
  sessionsLoaded: boolean;
  setCurrentSession: (session: StudySession) => void;
  setLoading: (loading: boolean) => void;
  addSession: (session: StudySession) => void;
  loadSessions: () => Promise<void>;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => Promise<void>;
  updateFlashcardDifficulty: (cardId: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  reviewFlashcard: (sessionId: string, cardId: string, rating: ReviewRating) => void;
  finishQuizAttempt: () => void;
  recordPracticeAttempt: (questions: QuizQuestion[], label?: string) => void;
  recordRescueAttempt: (sessionId: string, question: QuizQuestion) => void;
  reportQuestion: (sessionId: string, questionId: string, reason: string) => boolean;
  importBackupData: (data: unknown) => number;
  answerQuizQuestion: (questionId: string, answerIndex: number) => void;
  toggleRoadmapItem: (itemId: string) => void;
  resetQuizAnswers: () => void;
  submitQuizAnswers: (answers: Record<string, number>) => void;
}

function mapRowToSession(row: any): StudySession {
  return {
    id: row.id,
    title: row.title,
    videoUrl: row.video_url,
    flashcards: (row.flashcards as Flashcard[]) || [],
    quizQuestions: (row.quiz_questions as QuizQuestion[]) || [],
    roadmap: (row.roadmap as RoadmapItem[]) || [],
    createdAt: row.created_at,
    generation: (row.quiz_questions as QuizQuestion[])?.[0]?.generation,
  };
}

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
function scheduleSave(session: StudySession) {
  const timer = saveTimers.get(session.id);
  if (timer) clearTimeout(timer);
  saveTimers.set(session.id, setTimeout(() => {
    saveTimers.delete(session.id);
    void saveSessionToDB(session);
  }, 400));
}
const STORAGE_KEY = "flashlearn-private-sessions-v1";
const SELECTED_KEY = "flashlearn-current-session-v1";
function readPrivateSessions(): StudySession[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((s: any) => s && typeof s.id === "string" && Array.isArray(s.flashcards) && Array.isArray(s.quizQuestions))
      : [];
  } catch (e) { console.error("Could not read local study sessions", e); return []; }
}
function writePrivateSessions(sessions: StudySession[]): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); return true; }
  catch (e) { console.error("Local session storage is full or unavailable. Export or delete old sessions.", e); return false; }
}
async function saveSessionToDB(session: StudySession) {
  const pending = saveTimers.get(session.id);
  if (pending) { clearTimeout(pending); saveTimers.delete(session.id); }
  // The legacy shared backend has no owner-scoped RLS; do not send NEW student data there.
  const sessions = readPrivateSessions();
  writePrivateSessions([session, ...sessions.filter(s => s.id !== session.id)]);
}
export const useAppStore = create<AppState>((set, get) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  sessionsLoaded: false,

  setCurrentSession: (session) => { try { localStorage.setItem(SELECTED_KEY, session.id); } catch {} set({ currentSession: session }); },
  setLoading: (loading) => set({ isLoading: loading }),

  addSession: (session) => {
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSession: session,
    }));
    try { localStorage.setItem(SELECTED_KEY, session.id); } catch {}
    void saveSessionToDB(session);
  },

  loadSessions: async () => {
    const sessions = readPrivateSessions();
    let selected = "";
    try { selected = localStorage.getItem(SELECTED_KEY) || ""; } catch {}
    set(state => ({
      sessions, sessionsLoaded: true,
      currentSession: state.currentSession || sessions.find(s => s.id === selected) || sessions[0] || null,
    }));
  },

  selectSession: (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (session) {
      try { localStorage.setItem(SELECTED_KEY, id); } catch {}
      set({ currentSession: session });
    }
  },

  importBackupData: (data) => {
    const imported = validateStudyBackup(data);
    const existing = readPrivateSessions();
    const known = new Set(existing.map(s => s.id));
    const added = imported.filter(s => !known.has(s.id));
    if (added.length === 0) return 0;
    const merged = [...added, ...existing];
    if (!writePrivateSessions(merged)) throw new Error("Unable to save this backup. Browser storage may be full.");
    set(state => ({
      sessions: merged, sessionsLoaded: true,
      currentSession: state.currentSession || merged[0] || null,
    }));
    return added.length;
  },

  deleteSession: async (id) => {
    const pending = saveTimers.get(id);
    if (pending) clearTimeout(pending);
    saveTimers.delete(id);
    writePrivateSessions(readPrivateSessions().filter(s => s.id !== id));
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSession: state.currentSession?.id === id ? null : state.currentSession,
    }));
  },

  updateFlashcardDifficulty: (cardId, difficulty) =>
    set((state) => {
      if (!state.currentSession) return state;
      const updated = {
        ...state.currentSession,
        flashcards: state.currentSession.flashcards.map((c) =>
          c.id === cardId ? { ...c, difficulty } : c
        ),
      };
      scheduleSave(updated);
      return { currentSession: updated, sessions: state.sessions.map(s => s.id === updated.id ? updated : s) };
    }),


  reviewFlashcard: (sessionId, cardId, rating) => {
    const state = get();
    const original = state.sessions.find(s => s.id === sessionId) || (state.currentSession?.id === sessionId ? state.currentSession : null);
    if (!original) return;
    const updated: StudySession = {
      ...original,
      flashcards: original.flashcards.map(card => card.id === cardId ? {
        ...card,
        review: scheduleReview(card.review, rating),
        difficulty: rating === "again" || rating === "hard" ? "hard" : rating === "good" ? "medium" : "easy",
      } : card),
    };
    set(s => ({
      currentSession: s.currentSession?.id === sessionId ? updated : s.currentSession,
      sessions: s.sessions.map(item => item.id === sessionId ? updated : item),
    }));
    void saveSessionToDB(updated);
  },

  reportQuestion: (sessionId, questionId, reason) => {
    const previous = get().sessions.find(s=>s.id===sessionId) || (get().currentSession?.id===sessionId?get().currentSession:null);
    if (!previous || !(previous.quizQuestions.some(q => q.id === questionId)||(previous.practiceQuestions||[]).some(q=>q.id===questionId)) || reason.trim().length < 5 || reason.length > 500) return false;
    const item = { id: crypto.randomUUID(), questionId, reason: reason.trim(), createdAt: new Date().toISOString() };
    const updated: StudySession = { ...previous, questionReports: [...(previous.questionReports || []), item] };
    set(state => ({currentSession:state.currentSession?.id===sessionId?updated:state.currentSession,sessions:state.sessions.map(s => s.id === updated.id ? updated : s)}));
    void saveSessionToDB(updated);
    return true; // local-only; never imply a report was submitted to staff.
  },

  recordPracticeAttempt: (questions, label) => {
    if (!questions.length) return;
    if (label) {
      // Preserve each attempt with unique question IDs across sessions.
      const id = crypto.randomUUID();
      const uniquelyIdentified = questions.map(q => ({...q,id:id+"-"+q.id}));
      const entry = buildQuizAttempt(uniquelyIdentified,"drill",crypto.randomUUID());
      const session:StudySession = {
        id,title:label.slice(0,120),videoUrl:"",createdAt:new Date().toISOString(),
        flashcards:[],roadmap:[],quizQuestions:uniquelyIdentified.map(({userAnswer,...q})=>q),
        quizAttempts:[entry],
      };
      const state=get();
      set({sessions:[session,...state.sessions],currentSession:session});
      try {localStorage.setItem(SELECTED_KEY,session.id)}catch{}
      void saveSessionToDB(session);
      return;
    }
    const entry = buildQuizAttempt(questions,"drill",crypto.randomUUID());
    const previous = get().currentSession;
    if (!previous) return;
    const updated:StudySession = {...previous,
      practiceQuestions:[...(previous.practiceQuestions||[]),...questions.filter(q=>
        !previous.quizQuestions.some(old=>old.id===q.id) && !(previous.practiceQuestions||[]).some(old=>old.id===q.id))
        .map(({userAnswer,...q})=>q)],
      quizAttempts:[...(previous.quizAttempts||[]),entry],
    };
    set(state=>({currentSession:updated,sessions:state.sessions.map(s=>s.id===updated.id?updated:s)}));
    void saveSessionToDB(updated);
  },

  recordRescueAttempt: (sessionId, question) => {
    const old=get().sessions.find(s=>s.id===sessionId) || (get().currentSession?.id===sessionId?get().currentSession:null);
    if(!old)return;
    const entry=buildQuizAttempt([question],"quiz",crypto.randomUUID());
    const stored=old.quizQuestions.some(q=>q.id===question.id)||(old.practiceQuestions||[]).some(q=>q.id===question.id);
    const updated:StudySession={...old,
      practiceQuestions:stored?old.practiceQuestions:[...(old.practiceQuestions||[]),(({userAnswer,...q})=>q)(question)],
      quizAttempts:[...(old.quizAttempts||[]),entry],
    };
    set(state=>({sessions:state.sessions.map(s=>s.id===sessionId?updated:s),
      currentSession:state.currentSession?.id===sessionId?updated:state.currentSession}));
    void saveSessionToDB(updated);
  },

  finishQuizAttempt: () => {
    const previous = get().currentSession;
    if (!previous) return;
    const entry = buildQuizAttempt(previous.quizQuestions, "quiz", crypto.randomUUID());
    const updated = { ...previous, quizAttempts: [...(previous.quizAttempts || []), entry] };
    set(s => ({ currentSession: updated, sessions: s.sessions.map(item => item.id === updated.id ? updated : item) }));
    void saveSessionToDB(updated);
  },

  answerQuizQuestion: (questionId, answerIndex) =>
    set((state) => {
      if (!state.currentSession) return state;
      const updated = {
        ...state.currentSession,
        quizQuestions: state.currentSession.quizQuestions.map((q) =>
          q.id === questionId ? { ...q, userAnswer: answerIndex } : q
        ),
      };
      scheduleSave(updated);
      return { currentSession: updated, sessions: state.sessions.map(s => s.id === updated.id ? updated : s) };
    }),

  submitQuizAnswers: (answers) => {
    const previous = get().currentSession;
    if (!previous) return;
    const answered = previous.quizQuestions.map(q => {
      const { userAnswer, ...rest } = q;
      return answers[q.id] === undefined ? rest : { ...rest, userAnswer: answers[q.id] };
    });
    const entry = buildQuizAttempt(answered, "drill", crypto.randomUUID());
    const updated: StudySession = { ...previous, quizQuestions: answered, quizAttempts: [...(previous.quizAttempts || []), entry] };
    set(state => ({ currentSession: updated, sessions: state.sessions.map(s => s.id === updated.id ? updated : s) }));
    // Exam submission must be durable immediately, even if the student reloads at once.
    void saveSessionToDB(updated);
  },

  resetQuizAnswers: () => {
    const previous = get().currentSession;
    if (!previous) return;
    const updated: StudySession = { ...previous, quizQuestions: previous.quizQuestions.map(({ userAnswer, ...q }) => q) };
    set(state => ({ currentSession: updated, sessions: state.sessions.map(s => s.id === updated.id ? updated : s) }));
    scheduleSave(updated);
  },

  toggleRoadmapItem: (itemId) =>
    set((state) => {
      if (!state.currentSession) return state;
      const updated = {
        ...state.currentSession,
        roadmap: state.currentSession.roadmap.map((r) =>
          r.id === itemId ? { ...r, completed: !r.completed } : r
        ),
      };
      scheduleSave(updated);
      return { currentSession: updated, sessions: state.sessions.map(s => s.id === updated.id ? updated : s) };
    }),
}));

// Flush buffered edits when the browser navigates away or refreshes.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    const session = useAppStore.getState().currentSession;
    if (!session) return;
    const timer = saveTimers.get(session.id);
    if (timer) clearTimeout(timer);
    saveTimers.delete(session.id);
    void saveSessionToDB(session);
  });
}
