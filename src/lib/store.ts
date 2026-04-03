import { create } from 'zustand';

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
  userAnswer?: number;
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
}

interface AppState {
  currentSession: StudySession | null;
  sessions: StudySession[];
  isLoading: boolean;
  setCurrentSession: (session: StudySession) => void;
  setLoading: (loading: boolean) => void;
  addSession: (session: StudySession) => void;
  updateFlashcardDifficulty: (cardId: string, difficulty: 'easy' | 'medium' | 'hard') => void;
  answerQuizQuestion: (questionId: string, answerIndex: number) => void;
  toggleRoadmapItem: (itemId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  setCurrentSession: (session) => set({ currentSession: session }),
  setLoading: (loading) => set({ isLoading: loading }),
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSession: session,
    })),
  updateFlashcardDifficulty: (cardId, difficulty) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          flashcards: state.currentSession.flashcards.map((c) =>
            c.id === cardId ? { ...c, difficulty } : c
          ),
        },
      };
    }),
  answerQuizQuestion: (questionId, answerIndex) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          quizQuestions: state.currentSession.quizQuestions.map((q) =>
            q.id === questionId ? { ...q, userAnswer: answerIndex } : q
          ),
        },
      };
    }),
  toggleRoadmapItem: (itemId) =>
    set((state) => {
      if (!state.currentSession) return state;
      return {
        currentSession: {
          ...state.currentSession,
          roadmap: state.currentSession.roadmap.map((r) =>
            r.id === itemId ? { ...r, completed: !r.completed } : r
          ),
        },
      };
    }),
}));
