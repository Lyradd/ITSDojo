import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================
// TYPES & INTERFACES
// ============================================

export type QuestionType = 'multiple-choice' | 'short-answer' | 'true-false' | 'puzzle';

// ============================================
// QUESTION NORMALIZER
// ============================================
// Dosen membuat soal dengan format dari lib/evaluation-types.ts:
//   - type: 'multiple_choice' | 'true_false' | 'short_answer' | 'puzzle' | 'essay'
//   - options: Array<{id, text, isCorrect}> untuk MC
//   - correctAnswer: boolean untuk true_false
// Mahasiswa mengerjakan dengan format dari store ini:
//   - type: 'multiple-choice' | 'true-false' | 'short-answer' | 'puzzle'
//   - options: string[]
//   - correctAnswer: number (index) untuk MC dan true-false

export function normalizeQuestion(raw: any): Question {
  const rawType = String(raw?.type || '').replace(/_/g, '-');

  if (rawType === 'multiple-choice') {
    const rawOptions: any[] = Array.isArray(raw.options) ? raw.options : [];
    const options = rawOptions.map((o) => (typeof o === 'string' ? o : (o?.text ?? '')));
    const correctIndex = rawOptions.findIndex((o) => o?.isCorrect === true);
    return {
      id: raw.id,
      type: 'multiple-choice',
      question: raw.question || '',
      options,
      correctAnswer: correctIndex >= 0 ? correctIndex : (typeof raw.correctAnswer === 'number' ? raw.correctAnswer : 0),
      points: typeof raw.points === 'number' ? raw.points : 10,
      timeLimit: raw.timeLimit,
      explanation: raw.explanation,
    };
  }

  if (rawType === 'true-false') {
    let correctIndex = 0; // default Benar
    if (typeof raw.correctAnswer === 'boolean') {
      correctIndex = raw.correctAnswer ? 0 : 1;
    } else if (typeof raw.correctAnswer === 'number') {
      correctIndex = raw.correctAnswer;
    }
    return {
      id: raw.id,
      type: 'true-false',
      question: raw.question || '',
      options: ['Benar', 'Salah'],
      correctAnswer: correctIndex,
      points: typeof raw.points === 'number' ? raw.points : 10,
      timeLimit: raw.timeLimit,
      explanation: raw.explanation,
    };
  }

  if (rawType === 'short-answer' || rawType === 'essay') {
    return {
      id: raw.id,
      type: 'short-answer',
      question: raw.question || '',
      correctAnswer: String(raw.expectedAnswer ?? raw.correctAnswer ?? ''),
      points: typeof raw.points === 'number' ? raw.points : 10,
      timeLimit: raw.timeLimit,
      explanation: raw.explanation,
    };
  }

  if (rawType === 'puzzle') {
    const pairs = Array.isArray(raw.puzzlePairs) ? raw.puzzlePairs : [];
    return {
      id: raw.id,
      type: 'puzzle',
      question: raw.question || '',
      puzzlePairs: pairs.map((p: any) => ({ id: String(p.id), text: String(p.text || '') })),
      correctAnswer: Array.isArray(raw.correctAnswer) ? raw.correctAnswer : pairs.map((p: any) => String(p.id)),
      points: typeof raw.points === 'number' ? raw.points : 10,
      timeLimit: raw.timeLimit,
      explanation: raw.explanation,
    };
  }

  // Fallback: pertahankan struktur asli tapi pastikan minimal valid
  return {
    id: raw.id,
    type: 'multiple-choice',
    question: raw.question || '',
    options: [],
    correctAnswer: 0,
    points: typeof raw.points === 'number' ? raw.points : 10,
    timeLimit: raw.timeLimit,
  };
}

export function normalizeEvaluation<T extends Record<string, any>>(raw: T): T & { questions: Question[] } {
  const questions = Array.isArray(raw?.questions) ? raw.questions.map(normalizeQuestion) : [];
  return { ...(raw as any), questions };
}

export type UserRole = 'mahasiswa' | 'admin' | 'dosen';

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // For multiple-choice and true-false
  correctAnswer: string | number | boolean | string[]; // Index for MC, string for short answer, boolean for T/F, string[] for puzzle
  points: number;
  timeLimit?: number;
  explanation?: string;
  puzzlePairs?: { id: string; text: string }[];
}

export interface Answer {
  questionId: string;
  answer: string | number | boolean | string[];
  isCorrect: boolean;
  timestamp: number;
  pointsEarned: number;
  xpEarned?: number;
  gemsEarned?: number;
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
  batch?: string;
  coursesTaken?: number;
  // Group fields
  groupId?: string;
  groupName?: string;
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
  sessionXp: number;
  sessionGems: number;
  currentStreak: number;
  startTime: number | null;
  isEvaluationActive: boolean;
  isWaitingRoomActive: boolean;
  countdownEndTime: number | null;
  
  // Leaderboard Data
  leaderboard: LeaderboardEntry[];
  userRank: number;
  isLiveUpdateActive: boolean;
  lastLeaderboardUpdate: number;
  
  // User Role
  userRole: UserRole;
  
  // Actions - Evaluation
  startEvaluation: (evaluation: Evaluation) => void;
  submitAnswer: (questionId: string, answer: string | number | boolean | string[]) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishEvaluation: () => void;
  resetEvaluation: () => void;
  setStartTime: (time: number) => void;
  startWaitingRoomSession: () => void;
  initiateStartSequence: () => void;
  
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
      sessionXp: 0,
      sessionGems: 0,
      currentStreak: 0,
      startTime: null,
      isEvaluationActive: false,
      isWaitingRoomActive: true,
      countdownEndTime: null,
      
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
        sessionXp: 0,
        sessionGems: 0,
        currentStreak: 0,
        startTime: null, // Deferred — set after countdown
        isEvaluationActive: true,
        isWaitingRoomActive: true,
        countdownEndTime: null,
        isLiveUpdateActive: true,
      }),

      startWaitingRoomSession: () => set({ 
        isWaitingRoomActive: false,
        startTime: Date.now(),
        countdownEndTime: null
      }),

      initiateStartSequence: () => set({
        countdownEndTime: Date.now() + 5000
      }),

      setStartTime: (time) => set({ startTime: time }),
      
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
        } else if (question.type === 'puzzle') {
          const userSequence = Array.isArray(answer) ? answer : [];
          // If correctAnswer is defined, use it, otherwise use the order of puzzlePairs ids
          const correctSequence = Array.isArray(question.correctAnswer) 
            ? question.correctAnswer 
            : (question.puzzlePairs?.map(p => p.id) || []);
            
          isCorrect = userSequence.length === correctSequence.length && 
                      userSequence.every((val, index) => val === correctSequence[index]);
        }
        
        // Skenario Baru: Base Points buat Profil XP (konsisten), Bonus Streak masuk ke Skor Leaderboard
        const basePoints = isCorrect ? question.points : 0; // XP Murni
        const streakBonus = isCorrect ? (state.currentStreak * 2) : 0; // Bonus Streak
        const leaderboardScoreEarned = basePoints + streakBonus; // Skor buat ngadu di Leaderboard
        const gemsEarned = isCorrect ? 2 : 0; // 2 Gems per correct question
        
        const answerObj: Answer = {
          questionId,
          answer,
          isCorrect,
          timestamp: Date.now(),
          pointsEarned: leaderboardScoreEarned, // Poin ini yang ditampilin pas review jawaban
          xpEarned: basePoints, // Poin konsisten buat profil
          gemsEarned: gemsEarned,
        };
        
        const newAnswers = new Map(state.userAnswers);
        newAnswers.set(questionId, answerObj);
        
        // Update streak
        const newStreak = isCorrect ? state.currentStreak + 1 : 0;
        
        set({
          userAnswers: newAnswers,
          score: state.score + leaderboardScoreEarned,
          sessionXp: state.sessionXp + basePoints,
          sessionGems: state.sessionGems + gemsEarned,
          currentStreak: newStreak,
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
        currentStreak: 0,
        startTime: null,
        isEvaluationActive: false,
        isWaitingRoomActive: true,
        countdownEndTime: null,
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
        
        const totalQuestions = state.currentEvaluation?.questions.length || state.userAnswers.size;
        return Math.round((correctCount / totalQuestions) * 100);
      },
    }),
    {
      name: 'itsdojo-evaluation-storage',
      partialize: (state) => ({
        userRole: state.userRole,
        isWaitingRoomActive: state.isWaitingRoomActive,
        countdownEndTime: state.countdownEndTime,
        startTime: state.startTime,
        // Don't persist evaluation session details
      }),
    }
  )
);
