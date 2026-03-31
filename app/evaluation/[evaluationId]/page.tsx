'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { useEvaluationStore } from '@/lib/evaluation-store';
import {
  SAMPLE_EVALUATIONS,
  INITIAL_LEADERBOARD,
  generateMockLeaderboardUpdate,
  addCurrentUserToLeaderboard,
} from '@/lib/evaluation-data';
import { QuestionCard } from '@/components/evaluation/question-card';
import { LiveLeaderboard } from '@/components/leaderboard/live-leaderboard';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock,
  Target,
  Zap,
  TrendingUp,
  X,
} from 'lucide-react';
import { triggerConfetti, triggerBigConfetti, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

// ─── Countdown Overlay Component ───────────────────────────────────
function CountdownOverlay({
  evaluationTitle,
  onComplete,
}: {
  evaluationTitle: string;
  onComplete: () => void;
}) {
  const [count, setCount] = useState<number | 'go'>(3);

  useEffect(() => {
    if (count === 'go') {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setCount((prev) => {
        if (typeof prev === 'number' && prev > 1) return prev - 1;
        return 'go';
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative background rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full border border-white/10"
            style={{
              width: `${i * 250}px`,
              height: `${i * 250}px`,
              marginLeft: `${-i * 125}px`,
              marginTop: `${-i * 125}px`,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.05, 0.2],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.p
        className="text-blue-200 text-lg font-medium mb-8 tracking-wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {evaluationTitle}
      </motion.p>

      {/* Countdown Number */}
      <AnimatePresence mode="wait">
        <motion.div
          key={String(count)}
          initial={{ opacity: 0, scale: 0.3, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.8, y: -30 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {count === 'go' ? (
            <span className="text-8xl md:text-9xl font-black text-white drop-shadow-2xl tracking-tight">
              Mulai!
            </span>
          ) : (
            <span className="text-[12rem] md:text-[16rem] font-black text-white drop-shadow-2xl leading-none">
              {count}
            </span>
          )}

          {/* Pulse ring behind number */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
              transform: 'scale(2.5)',
            }}
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Subtitle */}
      <motion.p
        className="text-white/60 text-sm mt-10 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Bersiaplah...
      </motion.p>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function EvaluationFullscreenPage() {
  const router = useRouter();
  const params = useParams();
  const evaluationId = params.evaluationId as string;

  const { isLoggedIn, name } = useUserStore();
  const {
    currentEvaluation,
    startEvaluation,
    setStartTime,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    finishEvaluation,
    getCurrentQuestion,
    currentQuestionIndex,
    userAnswers,
    score,
    updateLeaderboard,
    isLiveUpdateActive,
    startTime,
    getProgress,
    getAccuracy,
  } = useEvaluationStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCountdownActive, setIsCountdownActive] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!startTime) return '00:00';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const [elapsedTime, setElapsedTime] = React.useState(getElapsedTime());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Initialize evaluation
  useEffect(() => {
    setIsMounted(true);

    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const evaluation = SAMPLE_EVALUATIONS.find((e) => e.id === evaluationId);
    if (!evaluation) {
      router.push('/evaluation');
      return;
    }

    if (!currentEvaluation || currentEvaluation.id !== evaluationId) {
      startEvaluation(evaluation);

      // Initialize leaderboard with current user
      const initialLeaderboard = addCurrentUserToLeaderboard(
        INITIAL_LEADERBOARD,
        name,
        0,
        evaluation.questions.length,
        0
      );
      updateLeaderboard(initialLeaderboard);
    }

    setIsInitialized(true);
  }, [evaluationId, isLoggedIn]);

  // Live leaderboard updates simulation
  useEffect(() => {
    if (!isLiveUpdateActive || !currentEvaluation) return;

    const interval = setInterval(() => {
      const currentLeaderboard = useEvaluationStore.getState().leaderboard;

      const updatedMockUsers = generateMockLeaderboardUpdate(
        currentLeaderboard.filter((e) => !e.isCurrentUser)
      );

      const currentUserEntry = currentLeaderboard.find((e) => e.isCurrentUser);
      if (currentUserEntry) {
        const updatedCurrentUser = {
          ...currentUserEntry,
          score: useEvaluationStore.getState().score,
          answeredQuestions: useEvaluationStore.getState().userAnswers.size,
          accuracy: useEvaluationStore.getState().getAccuracy(),
          lastUpdate: Date.now(),
        };
        useEvaluationStore.getState().updateLeaderboard([...updatedMockUsers, updatedCurrentUser]);
      } else {
        useEvaluationStore.getState().updateLeaderboard(updatedMockUsers);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLiveUpdateActive, currentEvaluation]);

  // Update current user's leaderboard entry when score changes
  useEffect(() => {
    if (!currentEvaluation) return;

    const currentLeaderboard = useEvaluationStore.getState().leaderboard;
    const updatedLeaderboard = addCurrentUserToLeaderboard(
      currentLeaderboard.filter((e) => !e.isCurrentUser),
      name,
      score,
      currentEvaluation.questions.length,
      userAnswers.size
    );

    updateLeaderboard(updatedLeaderboard);
  }, [score]);

  // Countdown finished → start the real timer
  const handleCountdownComplete = useCallback(() => {
    setIsCountdownActive(false);
    setStartTime(Date.now());
  }, [setStartTime]);

  const handleExitQuiz = () => {
    router.push('/evaluation');
  };

  if (!isMounted || !isLoggedIn || !isInitialized || !currentEvaluation) {
    return null;
  }

  const currentQuestion = getCurrentQuestion();
  const totalQuestions = currentEvaluation.questions.length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const currentAnswer = currentQuestion ? userAnswers.get(currentQuestion.id) : undefined;
  const progress = getProgress();
  const accuracy = getAccuracy();

  const handleSubmitAnswer = (answer: string | number | boolean) => {
    if (!currentQuestion) return;
    submitAnswer(currentQuestion.id, answer);
  };

  const handleFinish = () => {
    finishEvaluation();
    const pct = currentEvaluation ? (score / currentEvaluation.totalPoints) * 100 : 0;
    if (pct >= 90) {
      triggerBigConfetti();
    } else {
      triggerConfetti();
    }
    router.push(`/evaluation/${evaluationId}/results`);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
      {/* ── Countdown Overlay ── */}
      <AnimatePresence>
        {isCountdownActive && (
          <CountdownOverlay
            evaluationTitle={currentEvaluation.title}
            onComplete={handleCountdownComplete}
          />
        )}
      </AnimatePresence>

      {/* Top Stats Bar */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shrink-0">
        <div className="px-6 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">{currentEvaluation.title}</h1>
              <p className="text-blue-100 text-xs">{currentEvaluation.description}</p>
            </div>

            {/* Exit Button */}
            <button
              onClick={handleExitQuiz}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Keluar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 text-sm">
            {/* Progress */}
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <div>
                <span className="font-bold text-lg">{progress}%</span>
                <span className="text-blue-100 ml-2 text-xs">
                  {currentQuestionIndex + 1}/{totalQuestions} soal
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/20" />

            {/* Score */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" fill="currentColor" />
              <div>
                <span className="font-bold text-lg">{score}</span>
                <span className="text-blue-100 ml-2 text-xs">
                  dari {currentEvaluation.totalPoints} poin
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/20" />

            {/* Accuracy */}
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <div>
                <span className="font-bold text-lg">{accuracy}%</span>
                <span className="text-blue-100 ml-2 text-xs">akurasi</span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/20" />

            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <div>
                <span className="font-bold text-lg font-mono">{elapsedTime}</span>
                <span className="text-blue-100 ml-2 text-xs">
                  {currentEvaluation.duration} menit tersedia
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Question Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Question Card */}
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={totalQuestions}
                onSubmit={handleSubmitAnswer}
                isSubmitted={!!currentAnswer}
                userAnswer={currentAnswer?.answer}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={previousQuestion}
                disabled={isFirstQuestion}
                className="font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Sebelumnya
              </Button>

              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {userAnswers.size} / {totalQuestions} soal terjawab
              </div>

              {!isLastQuestion ? (
                <Button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-700 font-bold">
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleFinish} className="bg-green-600 hover:bg-green-700 font-bold">
                  <Flag className="w-4 h-4 mr-2" />
                  Selesai
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard Sidebar - Collapsible */}
        {isLeaderboardOpen && (
          <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Live Leaderboard</h3>
              <button
                onClick={() => setIsLeaderboardOpen(false)}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <LiveLeaderboard maxEntries={15} />
          </div>
        )}

        {/* Toggle Leaderboard Button */}
        {!isLeaderboardOpen && (
          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="fixed right-4 top-32 bg-blue-600 text-white px-3 py-2 rounded-l-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-xs font-bold">Show Leaderboard</span>
          </button>
        )}
      </div>
    </div>
  );
}
