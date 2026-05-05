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
  addBotsIfNeeded,
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
  Flame,
  Trophy,
  LogOut,
} from 'lucide-react';
import { triggerConfetti, triggerBigConfetti, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as React from 'react';

// ─── Pre-Quiz Carousel Component ───────────────────────────────────
const FUN_FACTS = [
  "Bug pertama di dunia adalah ngengat asli yang tersangkut di komputer Mark II pada tahun 1947.",
  "JavaScript dibuat hanya dalam waktu 10 hari oleh Brendan Eich pada tahun 1995.",
  "Tahukah kamu? Nama 'Python' bukan dari ular, melainkan grup komedi Monty Python.",
  "Developer menghabiskan 80% waktunya untuk membaca kode, dan 20% untuk menulisnya.",
  "Bahasa pemrograman pertama di dunia adalah 'Ada', dinamai dari Ada Lovelace.",
  "Sekitar 90% dari mata uang dunia saat ini hanya eksis di dalam komputer (digital).",
  "Linux menjalankan 100% dari 500 superkomputer tercepat di dunia saat ini.",
  "Domain pertama yang pernah didaftarkan adalah symbolics.com pada 15 Maret 1985.",
  "Lebih dari 70% dari semua kode di GitHub adalah duplikat dari kode yang sudah ada.",
  "Keyboard QWERTY didesain untuk memperlambat pengetikan agar mesin ketik manual tidak macet.",
  "NASA masih menggunakan kode dari tahun 70-an untuk beberapa misi luar angkasa Voyager.",
  "Steve Jobs dan Steve Wozniak memulai Apple di sebuah garasi rumah pada tahun 1976.",
  "Versi pertama Google disimpan di dalam sepuluh hard drive 4GB dalam kotak LEGO.",
  "Istilah 'Spam' untuk email sampah berasal dari sketsa grup komedi Monty Python.",
  "Minecraft awalnya ditulis menggunakan bahasa Java sebelum diakuisisi Microsoft.",
  "91% dari semua serangan siber di seluruh dunia dimulai dari email phishing.",
  "C++ awalnya dinamai 'C with Classes' sebelum akhirnya diganti pada tahun 1983."
];

function WaitingRoomOverlay({
  evaluationTitle,
  onStart,
}: {
  evaluationTitle: string;
  onStart: () => void;
}) {
  const { role } = useUserStore();
  const [currentFactIndex, setCurrentFactIndex] = useState(() => Math.floor(Math.random() * FUN_FACTS.length));
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Simulated joined users list
  const [participants, setParticipants] = useState<{name: string, avatar: string}[]>([
    { name: 'Ahmad Rizki', avatar: 'bg-blue-200 text-blue-700' },
    { name: 'Sarah Kusuma', avatar: 'bg-pink-200 text-pink-700' },
    { name: 'Budi Santoso', avatar: 'bg-green-200 text-green-700' },
    { name: 'Dinda Pratiwi', avatar: 'bg-purple-200 text-purple-700' },
    { name: 'Eko Prasetyo', avatar: 'bg-indigo-200 text-indigo-700' },
  ]);

  useEffect(() => {
    // Simulate users joining over time
    const interval = setInterval(() => {
      const names = ['Gilang', 'Fitri', 'Hana', 'Irfan', 'Joko', 'Kartika', 'Lestari', 'Fajar', 'Nadia', 'Omar'];
      const bgColors = ['bg-red-200 text-red-700', 'bg-teal-200 text-teal-700', 'bg-orange-200 text-orange-700', 'bg-cyan-200 text-cyan-700'];
      
      setParticipants(prev => {
        if (prev.length >= 25) return prev;
        const newName = names[Math.floor(Math.random() * names.length)] + ' ' + (prev.length + 1);
        const newColor = bgColors[Math.floor(Math.random() * bgColors.length)];
        return [...prev, { name: newName, avatar: newColor }];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nextFact = () => setCurrentFactIndex((p) => (p + 1) % FUN_FACTS.length);
  const prevFact = () => setCurrentFactIndex((p) => (p - 1 + FUN_FACTS.length) % FUN_FACTS.length);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-radial-gradient from-blue-900/20 to-transparent pointer-events-none" />
      
      <motion.div 
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-2">Ruang Tunggu Evaluasi</div>
        <h1 className="text-3xl md:text-4xl font-black text-white">{evaluationTitle}</h1>
      </motion.div>

      {/* Fun Fact Carousel */}
      <div className="flex items-center gap-6 max-w-2xl w-full px-4 mb-12">
        <Button variant="ghost" size="icon" onClick={prevFact} className="text-white hover:bg-white/10 shrink-0">
          <ChevronLeft className="w-8 h-8" />
        </Button>
        
        <div className="flex-1 text-center min-h-[120px] flex flex-col justify-center">
          <div className="text-sm text-zinc-400 font-bold tracking-widest uppercase mb-4 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            Fun Fact Koding
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={currentFactIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-2xl md:text-3xl font-medium text-zinc-100 leading-relaxed"
            >
              "{FUN_FACTS[currentFactIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

        <Button variant="ghost" size="icon" onClick={nextFact} className="text-white hover:bg-white/10 shrink-0">
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>

      {/* Status & Actions */}
      <div className="absolute bottom-16 w-full max-w-md px-6 flex flex-col items-center gap-6">
        <button 
          onClick={() => setShowParticipants(!showParticipants)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full border transition-all cursor-pointer",
            showParticipants 
              ? "bg-blue-600 border-blue-500 text-white" 
              : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
          )}
        >
          <div className={cn("w-2 h-2 rounded-full bg-green-500", !showParticipants && "animate-pulse")} />
          <span className="font-bold">{participants.length} Peserta telah bergabung</span>
          <ChevronRight className={cn("w-4 h-4 transition-transform", showParticipants ? "rotate-90" : "")} />
        </button>

        <AnimatePresence>
          {showParticipants && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden"
            >
              <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Daftar Peserta</div>
              <div className="grid grid-cols-4 gap-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {participants.map((user, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0", user.avatar)}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate w-full text-center">{user.name.split(' ')[0]}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(role === 'dosen' || role === 'admin' || role === 'asdos') ? (
          <Button 
            onClick={onStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl text-lg shadow-lg shadow-blue-500/25"
          >
            Mulai Sesi Sekarang
          </Button>
        ) : (
          <div className="w-full h-14 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-400 font-bold bg-zinc-900/50">
            Menunggu Dosen memulai sesi...
          </div>
        )}
      </div>
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
    currentStreak,
    isEvaluationActive,
    getProgress,
    getAccuracy,
  } = useEvaluationStore();

  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { isWaitingRoomActive, startWaitingRoomSession } = useEvaluationStore();
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);

  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!startTime || !currentEvaluation) return '00:00';
    const durationSecs = currentEvaluation.duration * 60;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const remaining = Math.max(0, durationSecs - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const [remainingTime, setRemainingTime] = React.useState(getRemainingTime());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setRemainingTime(getRemainingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, currentEvaluation]);

  // Sync across tabs (when Dosen starts the session)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'itsdojo-evaluation-storage') {
        // Force rehydrate store from local storage
        useEvaluationStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

    if (!currentEvaluation || currentEvaluation.id !== evaluationId || !isEvaluationActive) {
      startEvaluation(evaluation);

      // Initialize leaderboard with current user
      let initialLeaderboard = addCurrentUserToLeaderboard(
        INITIAL_LEADERBOARD,
        name,
        0,
        evaluation.questions.length,
        0
      );
      
      // Inject bots if threshold not met (e.g. need at least 15 participants)
      initialLeaderboard = addBotsIfNeeded(initialLeaderboard, 15, evaluation.questions.length);
      
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

  // Waiting Room finished → start the real timer
  const handleStartQuiz = useCallback(() => {
    startWaitingRoomSession();
  }, [startWaitingRoomSession]);

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
      {/* ── Waiting Room Overlay ── */}
      <AnimatePresence>
        {isWaitingRoomActive && (
          <WaitingRoomOverlay
            evaluationTitle={currentEvaluation.title}
            onStart={handleStartQuiz}
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
              onClick={() => setShowExitPrompt(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 text-white rounded-xl transition-all font-bold text-sm shadow-sm"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
              Keluar Kuis
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
                <span className="font-bold text-lg font-mono">{remainingTime}</span>
                <span className="text-blue-100 ml-2 text-xs">
                  tersisa dari {currentEvaluation.duration} mnt
                </span>
              </div>
            </div>

            {/* Streak */}
            <div className="h-6 w-px bg-white/20" />
            <div 
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300",
                currentStreak > 0 
                  ? "bg-white border-2 border-orange-400 text-orange-500 shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
                  : "bg-white/5 text-white/50 border border-white/10"
              )}
            >
              <motion.div
                animate={currentStreak >= 3 ? { rotate: [-10, 10, -10], scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Flame className="w-4 h-4" fill={currentStreak > 0 ? "currentColor" : "none"} />
              </motion.div>
              <div>
                <span className="font-bold text-lg">{currentStreak}</span>
                <span className={cn("ml-2 text-xs", currentStreak > 0 ? "text-orange-300/80" : "text-white/40")}>
                  streak
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="mt-4 flex gap-1">
            {currentEvaluation.questions.map((q, idx) => {
              const answer = userAnswers.get(q.id);
              const isCurrent = currentQuestionIndex === idx;
              
              let segmentClass = "bg-white/20"; // Unanswered
              if (answer) {
                segmentClass = answer.isCorrect ? "bg-green-400" : "bg-red-400";
              } else if (isCurrent) {
                segmentClass = "bg-white/60 animate-pulse";
              }

              return (
                <div 
                  key={q.id}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors duration-300",
                    segmentClass
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Toggle Navigator Button (Left) */}
        <AnimatePresence>
          {!isNavigatorOpen && (
            <motion.button
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
              onClick={() => setIsNavigatorOpen(true)}
              className="absolute left-0 top-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-l-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)] pr-4 pl-3 py-3 rounded-r-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:pl-5 transition-all group z-20 flex items-center gap-3 text-zinc-600 dark:text-zinc-400"
              title="Tampilkan Navigasi Soal"
            >
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <Target className="w-4 h-4 text-blue-500" />
                Navigasi
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Navigator Sidebar - Collapsible (Left) */}
        <AnimatePresence initial={false}>
          {isNavigatorOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 overflow-hidden z-10 relative"
            >
              <div className="w-[248px] h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Navigasi Soal
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsNavigatorOpen(false)} className="h-8 w-8 rounded-full text-zinc-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-4 pr-1">
                  {currentEvaluation.questions.map((q, idx) => {
                    const isAnswered = userAnswers.has(q.id);
                    const isCurrent = currentQuestionIndex === idx;
                    
                    return (
                      <button
                        key={q.id}
                        onClick={() => useEvaluationStore.setState({ currentQuestionIndex: idx })}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 transition-all border-2",
                          isCurrent 
                            ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 scale-105 shadow-md" 
                            : isAnswered 
                              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 opacity-80 hover:opacity-100" 
                              : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:border-blue-300"
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
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
        <AnimatePresence initial={false}>
          {isLeaderboardOpen && (
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 overflow-hidden"
            >
              <div className="w-[348px]">
                <LiveLeaderboard 
                  maxEntries={15} 
                  onClose={() => setIsLeaderboardOpen(false)}
                  className="shadow-sm border-zinc-200/80 dark:border-zinc-800/80" 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Leaderboard Button */}
        <AnimatePresence>
          {!isLeaderboardOpen && (
            <motion.button
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
              onClick={() => setIsLeaderboardOpen(true)}
              className="absolute right-0 top-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-r-0 shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)] pl-4 pr-3 py-3 rounded-l-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:pr-5 transition-all group z-20 flex items-center gap-3 text-zinc-600 dark:text-zinc-400"
              title="Tampilkan Leaderboard"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Leaderboard
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowExitPrompt(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                  <LogOut className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">Keluar Kuis?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6">
                  Progres kuis kamu tidak akan tersimpan. Apakah kamu yakin ingin keluar sekarang?
                </p>
                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 font-bold rounded-xl"
                    onClick={() => setShowExitPrompt(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 font-bold rounded-xl"
                    onClick={handleExitQuiz}
                  >
                    Ya, Keluar
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
