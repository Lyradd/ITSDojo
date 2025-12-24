import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES & INTERFACES
// ============================================

export type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false';

export type UserRole = 'mahasiswa' | 'asisten' | 'dosen';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice and true-false
  correctAnswer: string | number; // Index for MC, string for short answer, boolean for T/F
  points: number;
  explanation?: string;
}

export interface Answer {
  questionId: string;
  answer: string | number | boolean;
  isCorrect: boolean;
  timestamp: number;
  pointsEarned: number;
}

export interface Evaluation {
  id: string;
  title: string;
  description: string;
  courseId: string;
  questions: Question[];
  duration: number; // in minutes
  totalPoints: number;
  isActive: boolean;
  startTime?: number;
  endTime?: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatar: string;
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  accuracy: number; // percentage
  rank: number;
  previousRank?: number;
  lastUpdate: number;
  isCurrentUser?: boolean;
}

// ============================================
// ZUSTAND STORE
// ============================================

interface EvaluationState {
  // Current Evaluation Session
  currentEvaluation: Evaluation | null;
  userAnswers: Map<string, Answer>;
  currentQuestionIndex: number;
  score: number;
  startTime: number | null;
  isEvaluationActive: boolean;
  
  // Leaderboard Data
  leaderboard: LeaderboardEntry[];
  userRank: number;
  isLiveUpdateActive: boolean;
  lastLeaderboardUpdate: number;
  
  // User Role
  userRole: UserRole;
  
  // Actions - Evaluation
  startEvaluation: (evaluation: Evaluation) => void;
  submitAnswer: (questionId: string, answer: string | number | boolean) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishEvaluation: () => void;
  resetEvaluation: () => void;
  
  // Actions - Leaderboard
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  setLiveUpdateActive: (active: boolean) => void;
  
  // Actions - User
  setUserRole: (role: UserRole) => void;
  
  // Getters
  getCurrentQuestion: () => Question | null;
  getProgress: () => number;
  getAccuracy: () => number;
}

export const useEvaluationStore = create<EvaluationState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentEvaluation: null,
      userAnswers: new Map(),
      currentQuestionIndex: 0,
      score: 0,
      startTime: null,
      isEvaluationActive: false,
      
      leaderboard: [],
      userRank: 0,
      isLiveUpdateActive: false,
      lastLeaderboardUpdate: 0,
      
      userRole: 'mahasiswa',
      
      // ============================================
      // EVALUATION ACTIONS
      // ============================================
      
      startEvaluation: (evaluation) => set({
        currentEvaluation: evaluation,
        userAnswers: new Map(),
        currentQuestionIndex: 0,
        score: 0,
        startTime: Date.now(),
        isEvaluationActive: true,
        isLiveUpdateActive: true,
      }),
      
      submitAnswer: (questionId, answer) => {
        const state = get();
        const question = state.currentEvaluation?.questions.find(q => q.id === questionId);
        
        if (!question) return;
        
        // Check if answer is correct
        let isCorrect = false;
        if (question.type === 'multiple-choice') {
          isCorrect = answer === question.correctAnswer;
        } else if (question.type === 'true-false') {
          isCorrect = answer === question.correctAnswer;
        } else if (question.type === 'short-answer') {
          // Case-insensitive comparison for short answer
          const userAnswer = String(answer).toLowerCase().trim();
          const correctAnswer = String(question.correctAnswer).toLowerCase().trim();
          isCorrect = userAnswer === correctAnswer;
        }
        
        const pointsEarned = isCorrect ? question.points : 0;
        
        const answerObj: Answer = {
          questionId,
          answer,
          isCorrect,
          timestamp: Date.now(),
          pointsEarned,
        };
        
        const newAnswers = new Map(state.userAnswers);
        newAnswers.set(questionId, answerObj);
        
        set({
          userAnswers: newAnswers,
          score: state.score + pointsEarned,
        });
      },
      
      nextQuestion: () => {
        const state = get();
        const maxIndex = (state.currentEvaluation?.questions.length || 1) - 1;
        if (state.currentQuestionIndex < maxIndex) {
          set({ currentQuestionIndex: state.currentQuestionIndex + 1 });
        }
      },
      
      previousQuestion: () => {
        const state = get();
        if (state.currentQuestionIndex > 0) {
          set({ currentQuestionIndex: state.currentQuestionIndex - 1 });
        }
      },
      
      finishEvaluation: () => set({
        isEvaluationActive: false,
        isLiveUpdateActive: false,
      }),
      
      resetEvaluation: () => set({
        currentEvaluation: null,
        userAnswers: new Map(),
        currentQuestionIndex: 0,
        score: 0,
        startTime: null,
        isEvaluationActive: false,
        isLiveUpdateActive: false,
      }),
      
      // ============================================
      // LEADERBOARD ACTIONS
      // ============================================
      
      updateLeaderboard: (entries) => {
        // Sort by score (descending)
        const sortedEntries = [...entries].sort((a, b) => b.score - a.score);
        
        // Update ranks and track previous ranks
        const updatedEntries = sortedEntries.map((entry, index) => ({
          ...entry,
          previousRank: entry.rank,
          rank: index + 1,
        }));
        
        // Find current user's rank
        const currentUserEntry = updatedEntries.find(e => e.isCurrentUser);
        const userRank = currentUserEntry?.rank || 0;
        
        set({
          leaderboard: updatedEntries,
          userRank,
          lastLeaderboardUpdate: Date.now(),
        });
      },
      
      setLiveUpdateActive: (active) => set({ isLiveUpdateActive: active }),
      
      // ============================================
      // USER ACTIONS
      // ============================================
      
      setUserRole: (role) => set({ userRole: role }),
      
      // ============================================
      // GETTERS
      // ============================================
      
      getCurrentQuestion: () => {
        const state = get();
        if (!state.currentEvaluation) return null;
        return state.currentEvaluation.questions[state.currentQuestionIndex] || null;
      },
      
      getProgress: () => {
        const state = get();
        if (!state.currentEvaluation) return 0;
        const total = state.currentEvaluation.questions.length;
        const answered = state.userAnswers.size;
        return Math.round((answered / total) * 100);
      },
      
      getAccuracy: () => {
        const state = get();
        if (state.userAnswers.size === 0) return 0;
        
        let correctCount = 0;
        state.userAnswers.forEach(answer => {
          if (answer.isCorrect) correctCount++;
        });
        
        return Math.round((correctCount / state.userAnswers.size) * 100);
      },
    }),
    {
      name: 'itsdojo-evaluation-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        // Don't persist evaluation session (should be fresh each time)
      }),
    }
  )
);
