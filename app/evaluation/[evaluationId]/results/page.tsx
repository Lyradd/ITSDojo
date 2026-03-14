"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { useEvaluationStore } from '@/lib/evaluation-store';
import { SAMPLE_EVALUATIONS } from '@/lib/evaluation-data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LiveLeaderboard } from '@/components/leaderboard/live-leaderboard';
import { 
  Trophy, 
  Target, 
  Zap, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  Home,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EvaluationResultsPage() {
  const router = useRouter();
  const params = useParams();
  const evaluationId = params.evaluationId as string;
  
  const { isLoggedIn, name, addXp } = useUserStore();
  const { 
    currentEvaluation,
    score,
    userAnswers,
    getAccuracy,
    userRank,
    resetEvaluation,
  } = useEvaluationStore();
  
  const [isMounted, setIsMounted] = useState(false);
  const [hasAddedXp, setHasAddedXp] = useState(false);

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

    // Add XP reward (only once)
    if (!hasAddedXp && score > 0) {
      addXp(score);
      setHasAddedXp(true);
    }
  }, [evaluationId, isLoggedIn, score, hasAddedXp]);

  if (!isMounted || !isLoggedIn || !currentEvaluation) {
    return null;
  }

  const accuracy = getAccuracy();
  const totalQuestions = currentEvaluation.questions.length;
  const correctAnswers = Array.from(userAnswers.values()).filter(a => a.isCorrect).length;
  const wrongAnswers = userAnswers.size - correctAnswers;

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return { text: 'Luar Biasa! 🎉', color: 'text-green-600' };
    if (accuracy >= 75) return { text: 'Bagus Sekali! 👏', color: 'text-blue-600' };
    if (accuracy >= 60) return { text: 'Cukup Baik! 👍', color: 'text-yellow-600' };
    return { text: 'Tetap Semangat! 💪', color: 'text-orange-600' };
  };

  const performance = getPerformanceMessage();

  const handleRetry = () => {
    resetEvaluation();
    router.push(`/evaluation/${evaluationId}`);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-4 shadow-lg">
          <Trophy className="w-10 h-10 text-white" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
          Evaluasi Selesai!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {currentEvaluation.title}
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: Results */}
        <div className="space-y-6">
          {/* Performance Card */}
          <Card className="p-8 rounded-2xl border-2 text-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
            <h2 className={cn("text-4xl font-bold mb-2", performance.color)}>
              {performance.text}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Kamu berhasil menyelesaikan evaluasi dengan baik
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border-2">
                <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" fill="currentColor" />
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{score}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Total Poin</div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border-2">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{accuracy}%</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Akurasi</div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border-2">
                <Trophy className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">#{userRank}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Peringkat</div>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border-2">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{userAnswers.size}/{totalQuestions}</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Terjawab</div>
              </div>
            </div>
          </Card>

          {/* Answer Summary */}
          <Card className="p-6 rounded-2xl border-2">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
              Ringkasan Jawaban
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border-2 border-green-200 dark:border-green-800">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">{correctAnswers}</div>
                  <div className="text-sm text-green-600 dark:text-green-500">Benar</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border-2 border-red-200 dark:border-red-800">
                <XCircle className="w-8 h-8 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">{wrongAnswers}</div>
                  <div className="text-sm text-red-600 dark:text-red-500">Salah</div>
                </div>
              </div>
            </div>

            {/* Question Review */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                Review Jawaban:
              </h4>
              {currentEvaluation.questions.map((question, index) => {
                const answer = userAnswers.get(question.id);
                const isCorrect = answer?.isCorrect || false;

                return (
                  <div 
                    key={question.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      isCorrect 
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
                        : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        Soal {index + 1}: {question.question}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-zinc-600 dark:text-zinc-400">
                      {answer?.pointsEarned || 0} poin
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/evaluation" className="flex-1">
              <Button variant="outline" className="w-full font-bold">
                <Home className="w-4 h-4 mr-2" />
                Kembali ke Daftar
              </Button>
            </Link>
            <Button 
              onClick={handleRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>

        {/* Right: Final Leaderboard */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <LiveLeaderboard 
            showHeader={true}
            maxEntries={15}
          />
          
          <Card className="mt-4 p-4 rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-yellow-600" fill="currentColor" />
              <div>
                <p className="font-bold text-yellow-800 dark:text-yellow-200 text-sm">
                  +{score} XP Diterima!
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  XP telah ditambahkan ke profilmu
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
