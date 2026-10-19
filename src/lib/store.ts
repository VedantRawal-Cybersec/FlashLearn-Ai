import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
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

async function saveSessionToDB(session: StudySession) {
  const { error } = await supabase.from('study_sessions').upsert({
    id: session.id,
    title: session.title,
    video_url: session.videoUrl,
    flashcards: session.flashcards as any,
    quiz_questions: session.quizQuestions as any,
    roadmap: session.roadmap as any,
    quiz_submitted: session.quizQuestions.some((q) => q.userAnswer !== undefined),
  });
  if (error) console.error('Failed to save session:', error);
}

export const useAppStore = create<AppState>((set, get) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  sessionsLoaded: false,

  setCurrentSession: (session) => set({ currentSession: session }),
  setLoading: (loading) => set({ isLoading: loading }),

  addSession: (session) => {
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSession: session,
    }));
    saveSessionToDB(session);
  },

  loadSessions: async () => {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load sessions:', error);
      return;
    }
    const sessions = (data || []).map(mapRowToSession);
    set({ sessions, sessionsLoaded: true });
  },

  selectSession: (id) => {
    const session = get().sessions.find((s) => s.id === id);
    if (session) set({ currentSession: session });
  },

  deleteSession: async (id) => {
    await supabase.from('study_sessions').delete().eq('id', id);
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
      saveSessionToDB(updated);
      return { currentSession: updated };
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
      saveSessionToDB(updated);
      return { currentSession: updated };
    }),

  toggleRoadmapItem: (itemId) =>
    set((state) => {
      if (!state.currentSession) return state;
      const updated = {
        ...state.currentSession,
        roadmap: state.currentSession.roadmap.map((r) =>
          r.id === itemId ? { ...r, completed: !r.completed } : r
        ),
      };
      saveSessionToDB(updated);
      return { currentSession: updated };
    }),
}));
