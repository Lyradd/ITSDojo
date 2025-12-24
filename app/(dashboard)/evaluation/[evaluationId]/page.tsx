"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { useEvaluationStore } from '@/lib/evaluation-store';
import { SAMPLE_EVALUATIONS, INITIAL_LEADERBOARD, generateMockLeaderboardUpdate, addCurrentUserToLeaderboard } from '@/lib/evaluation-data';
import { QuestionCard } from '@/components/evaluation/question-card';
import { EvaluationHeader } from '@/components/evaluation/evaluation-header';
import { LiveLeaderboard } from '@/components/leaderboard/live-leaderboard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { triggerConfetti } from '@/lib/utils';

export default function EvaluationActivePage() {
  const router = useRouter();
  const params = useParams();
  const evaluationId = params.evaluationId as string;
  
  const { isLoggedIn, name } = useUserStore();
  const { 
    currentEvaluation,
    startEvaluation,
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
  } = useEvaluationStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize evaluation
  useEffect(() => {
    setIsMounted(true);
    
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    const evaluation = SAMPLE_EVALUATIONS.find(e => e.id === evaluationId);
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
      
      // Update mock users
      const updatedMockUsers = generateMockLeaderboardUpdate(
        currentLeaderboard.filter((e) => !e.isCurrentUser)
      );
      
      // Keep current user with latest score
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
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isLiveUpdateActive, currentEvaluation]);

  // Update current user's leaderboard entry when score changes
  useEffect(() => {
    if (!currentEvaluation) return;
    
    const currentLeaderboard = useEvaluationStore.getState().leaderboard;
    const updatedLeaderboard = addCurrentUserToLeaderboard(
      currentLeaderboard.filter(e => !e.isCurrentUser),
      name,
      score,
      currentEvaluation.questions.length,
      userAnswers.size
    );
    
    updateLeaderboard(updatedLeaderboard);
  }, [score]);

  if (!isMounted || !isLoggedIn || !isInitialized || !currentEvaluation) {
    return null;
  }

  const currentQuestion = getCurrentQuestion();
  const totalQuestions = currentEvaluation.questions.length;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const currentAnswer = currentQuestion ? userAnswers.get(currentQuestion.id) : undefined;

  const handleSubmitAnswer = (answer: string | number | boolean) => {
    if (!currentQuestion) return;
    submitAnswer(currentQuestion.id, answer);
  };

  const handleFinish = () => {
    finishEvaluation();
    triggerConfetti();
    router.push(`/evaluation/${evaluationId}/results`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Evaluation Header */}
      <EvaluationHeader className="mb-6" />

      {/* Main Content: Question + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Question */}
        <div className="space-y-4">
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
              <Button
                onClick={nextQuestion}
                className="bg-blue-600 hover:bg-blue-700 font-bold"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                className="bg-green-600 hover:bg-green-700 font-bold"
              >
                <Flag className="w-4 h-4 mr-2" />
                Selesai
              </Button>
            )}
          </div>
        </div>

        {/* Right: Live Leaderboard */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <LiveLeaderboard maxEntries={15} />
        </div>
      </div>
    </div>
  );
}
