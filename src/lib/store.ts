import { create } from 'zustand';
import type { StudyOptions } from '../../supabase/functions/_shared/study-options';

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
  roadmap: RoadmapItem[];
  createdAt: string;
  generation?: GenerationInfo;
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
function writePrivateSessions(sessions: StudySession[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }
  catch (e) { console.error("Local session storage is full or unavailable. Export or delete old sessions.", e); }
}
async function saveSessionToDB(session: StudySession) {
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
    const updated: StudySession = { ...previous, quizQuestions: previous.quizQuestions.map(q => {
      const { userAnswer, ...rest } = q;
      return answers[q.id] === undefined ? rest : { ...rest, userAnswer: answers[q.id] };
    }) };
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
