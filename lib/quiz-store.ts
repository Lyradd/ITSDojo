import { create } from 'zustand';
import type { Question, Quiz } from './quiz-mock-data';

interface Answer {
  questionId: string;
  answer: string | number;
  isCorrect: boolean;
  basePoints: number;
  timeBonus: number;
  totalPoints: number;
  timeSpent: number;
  submittedAt: number;
}

interface QuizState {
  quiz: Quiz | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Map<string, Answer>;
  totalScore: number;
  bloomScores: {
    C1: number;
    C2: number;
    C3: number;
    C4: number;
    C5: number;
    C6: number;
  };
  timeRemaining: number; // seconds for current question
  isTimerActive: boolean;
  quizStartTime: number;
  
  // Actions
  initQuiz: (quiz: Quiz, questions: Question[]) => void;
  setCurrentQuestion: (index: number) => void;
  submitAnswer: (questionId: string, answer: string | number, timeSpent: number) => void;
  nextQuestion: () => void;
  startTimer: (duration: number) => void;
  tickTimer: () => void;
  stopTimer: () => void;
  finishQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  quiz: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: new Map(),
  totalScore: 0,
  bloomScores: {
    C1: 0,
    C2: 0,
    C3: 0,
    C4: 0,
    C5: 0,
    C6: 0,
  },
  timeRemaining: 0,
  isTimerActive: false,
  quizStartTime: 0,

  initQuiz: (quiz, questions) => {
    set({
      quiz,
      questions,
      currentQuestionIndex: 0,
      answers: new Map(),
      totalScore: 0,
      bloomScores: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      quizStartTime: Date.now(),
    });
  },

  setCurrentQuestion: (index) => {
    set({ currentQuestionIndex: index });
  },

  submitAnswer: (questionId, answer, timeSpent) => {
    const { questions, bloomScores } = get();
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    // Calculate if correct
    const isCorrect = checkAnswer(answer, question);

    // Calculate points
    const basePoints = isCorrect ? question.bloomWeight : 0;
    const timeRatio = timeSpent / question.timeLimit;
    const timeBonus = isCorrect
      ? timeRatio < 0.3
        ? 5
        : timeRatio < 0.5
        ? 3
        : timeRatio < 0.7
        ? 2
        : 0
      : 0;
    const totalPoints = basePoints + timeBonus;

    const answerObj: Answer = {
      questionId,
      answer,
      isCorrect,
      basePoints,
      timeBonus,
      totalPoints,
      timeSpent,
      submittedAt: Date.now(),
    };

    const newAnswers = new Map(get().answers);
    newAnswers.set(questionId, answerObj);

    // Update Bloom scores
    const newBloomScores = { ...bloomScores };
    if (isCorrect) {
      newBloomScores[question.bloomLevel as keyof typeof bloomScores] += totalPoints;
    }

    set({
      answers: newAnswers,
      totalScore: get().totalScore + totalPoints,
      bloomScores: newBloomScores,
    });
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  startTimer: (duration) => {
    set({
      timeRemaining: duration,
      isTimerActive: true,
    });
  },

  tickTimer: () => {
    const { timeRemaining, isTimerActive } = get();
    if (isTimerActive && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  stopTimer: () => {
    set({ isTimerActive: false });
  },

  finishQuiz: () => {
    set({
      isTimerActive: false,
    });
  },

  reset: () => {
    set({
      quiz: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: new Map(),
      totalScore: 0,
      bloomScores: { C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, C6: 0 },
      timeRemaining: 0,
      isTimerActive: false,
      quizStartTime: 0,
    });
  },
}));

// Helper function to check answer
function checkAnswer(userAnswer: string | number, question: Question): boolean {
  if (question.questionType === 'slider') {
    const correctAnswer = question.correctAnswer as number;
    const margin = question.answerMargin || 0;
    const numAnswer = Number(userAnswer);
    return numAnswer >= correctAnswer - margin && numAnswer <= correctAnswer + margin;
  }

  if (question.questionType === 'short_answer') {
    // Simple keyword matching (case-insensitive)
    const userText = String(userAnswer).toLowerCase();
    const correctKeywords = String(question.correctAnswer).toLowerCase().split(' ');
    return correctKeywords.some((keyword) => userText.includes(keyword));
  }

  // Exact match for MC and T/F
  return String(userAnswer).toLowerCase() === String(question.correctAnswer).toLowerCase();
}
