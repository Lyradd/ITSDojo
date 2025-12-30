"use client";

import { useEvaluationStore } from '@/lib/evaluation-store';
import { Clock, Target, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvaluationHeaderProps {
  className?: string;
}

export function EvaluationHeader({ className }: EvaluationHeaderProps) {
  const { 
    currentEvaluation, 
    score, 
    startTime,
    getProgress,
    getAccuracy,
    currentQuestionIndex,
  } = useEvaluationStore();

  if (!currentEvaluation) return null;

  const progress = getProgress();
  const accuracy = getAccuracy();
  const totalQuestions = currentEvaluation.questions.length;
  const currentQuestion = currentQuestionIndex + 1;

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

  return (
    <div className={cn("bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg", className)}>
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-1">{currentEvaluation.title}</h1>
        <p className="text-blue-100 text-sm">{currentEvaluation.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Progress */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium text-blue-100">Progress</span>
          </div>
          <div className="text-2xl font-bold">{progress}%</div>
          <div className="text-xs text-blue-100 mt-1">
            {currentQuestion} / {totalQuestions} soal
          </div>
        </div>

        {/* Score */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4" fill="currentColor" />
            <span className="text-xs font-medium text-blue-100">Score</span>
          </div>
          <div className="text-2xl font-bold">{score}</div>
          <div className="text-xs text-blue-100 mt-1">
            dari {currentEvaluation.totalPoints} poin
          </div>
        </div>

        {/* Accuracy */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium text-blue-100">Akurasi</span>
          </div>
          <div className="text-2xl font-bold">{accuracy}%</div>
          <div className="text-xs text-blue-100 mt-1">
            jawaban benar
          </div>
        </div>

        {/* Time */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-medium text-blue-100">Waktu</span>
          </div>
          <div className="text-2xl font-bold font-mono">{elapsedTime}</div>
          <div className="text-xs text-blue-100 mt-1">
            {currentEvaluation.duration} menit tersedia
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Add React import at the top
import * as React from 'react';
