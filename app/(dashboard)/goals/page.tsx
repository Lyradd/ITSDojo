"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store";
import { formatLocalDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  CheckCircle,
  Gift,
  Zap,
  BookOpen,
  Trophy,
  Gem,
  Clock,
  Snowflake,
  Check
} from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { playCoinSound } from "@/lib/sounds";
import { useMultiplierTimer } from "@/hooks/use-multiplier-timer";
import { StreakCalendarModal } from "@/components/shared/streak-calendar-modal";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { ChevronRight as ChevronRightIcon } from "lucide-react";

// --- Helper Functions for Goal Styling ---
const getGoalCardStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-50 border-zinc-100 opacity-60 dark:bg-zinc-900/50 dark:border-zinc-800 grayscale-[0.5]";
  if (goal.isCompleted) return "border-green-400 bg-green-50 shadow-md ring-1 ring-green-200 dark:bg-green-900/20 dark:border-green-600 dark:ring-green-800";
  return "border-zinc-200 hover:border-blue-300 dark:border-zinc-700 dark:hover:border-blue-600";
};

const getGoalIconBoxStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-200 text-zinc-400 scale-95 dark:bg-zinc-700 dark:text-zinc-500";
  if (goal.isCompleted) return "bg-green-500 text-white shadow-green-200 scale-110 dark:shadow-green-900";
  if (goal.type === "xp") return "bg-blue-100 text-blue-500 dark:bg-blue-900/40 dark:text-blue-400";
  if (goal.type === "perfect") return "bg-emerald-100 text-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-400";
  return "bg-purple-100 text-purple-500 dark:bg-purple-900/40 dark:text-purple-400";
};

const getGoalProgressBarStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-400";
  if (goal.isCompleted) return "bg-green-500";
  return "bg-blue-500";
};

const GoalIcon = ({ goal }: { goal: any }) => {
  if (goal.isClaimed) return <CheckCircle className="w-8 h-8" />;
  if (goal.type === "xp") return <Zap className="w-7 h-7 fill-current" />;
  if (goal.type === "perfect") return <Trophy className="w-7 h-7" />;
  return <BookOpen className="w-7 h-7" />;
};

export default function GoalsPage() {
  const {
    dailyGoals,
    streak,
    claimGoalReward,
    multiplierEndTime,
    xpMultiplier,
    activityHistory,
    xp,
    weeklyRewardClaimed,
    claimWeeklyReward,
    monthlyRewardClaimed,
    claimMonthlyReward,
    streakFreezeCount,
    level,
    weeklyTarget,
    isWeeklyTargetLocked,
    setWeeklyTarget
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const timeLeft = useMultiplierTimer();
  const [resetTimeLeft, setResetTimeLeft] = useState<string | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [targetToConfirm, setTargetToConfirm] = useState<number | null>(null);

  // 1. Cek Mounted 
  useEffect(() => { setIsMounted(true); }, []);

  // Timer Mundur untuk Reset Harian (Midnight)
  useEffect(() => {
    const updateResetTime = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      setResetTimeLeft(`${hours}h ${minutes}m`);
    };
    updateResetTime();
    const interval = setInterval(updateResetTime, 60000); // Update setiap menit
    return () => clearInterval(interval);
  }, []);

  if (!isMounted) return null;

  // 3. Logika Data Kalender Streak dari Activity History
  const days = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];
  const now = new Date();
  const todayIndex = (now.getDay() + 6) % 7; // Memastikan Senin=0, ..., Minggu=6 tanpa nilai negatif

  const streakHistory = days.map((day, index) => {
    const diff = index - todayIndex;
    const d = new Date();
    d.setDate(now.getDate() + diff);
    const dateString = formatLocalDate(d);

    // Aktif jika ada activity pada tanggal tersebut
    const hasActivity = activityHistory.some((h: { date: string, count: number }) => h.date === dateString && h.count > 0);
    return { day, active: hasActivity, isToday: index === todayIndex };
  });

  // Hitung Weekly Target (User Adjustable)
  const activeDaysThisWeek = streakHistory.filter(h => h.active).length;
  const weeklyProgress = Math.min((activeDaysThisWeek / weeklyTarget) * 100, 100);

  // Hitung Monthly Challenge (XP asli bulan ini dari activityHistory)
  const monthlyTarget = 1000;
  const currentMonthPrefix = now.toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthlyXp = activityHistory
    .filter((h: any) => h.date.startsWith(currentMonthPrefix))
    .reduce((sum: number, h: any) => sum + (h.xpEarned || 0), 0); // XP aktual yang didapat
  
  const monthlyProgress = Math.min((currentMonthlyXp / monthlyTarget) * 100, 100);

  // Hitung sisa hari di bulan ini
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  // 4. Wrapper Fungsi Klaim Hadiah
  const handleClaim = (goalId: string) => {
    claimGoalReward(goalId);
    triggerConfetti();
    playCoinSound();
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* =========================================
            KOLOM KIRI: DAFTAR MISI & BANNER
           ========================================= */}
        <div className="flex flex-col gap-6">

          {/* Header Page */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold text-zinc-800 dark:text-white">
                Misi Harian
              </h1>
              {resetTimeLeft && (
                <p className="text-sm font-medium text-zinc-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> Reset dalam {resetTimeLeft}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Streak Freeze Indicator */}
              {streakFreezeCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl font-bold text-sm" title={`${streakFreezeCount} Streak Freeze Aktif`}>
                  <Snowflake className="w-4 h-4" />
                  <span>{streakFreezeCount}</span>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 rounded-xl font-bold">
                <Flame className="w-5 h-5 fill-current" />
                <span>{streak} Hari Streak</span>
              </div>
            </div>
          </div>

          {/* BANNER 1: Active Boost */}
          {timeLeft && (
            <div className="animate-in slide-in-from-top-4 duration-500 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm animate-pulse">
                  <Zap className="w-6 h-6 text-yellow-300 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-none">Double XP Aktif!</h3>
                  <p className="text-purple-100 text-xs">Semua XP dikalikan {xpMultiplier}x</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-2xl font-mono font-bold tracking-widest bg-black/20 px-3 py-1 rounded-lg border border-white/10">
                <Clock className="w-5 h-5" />
                {timeLeft}
              </div>
            </div>
          )}

          {/* BANNER 2: Hadiah Harian Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 space-y-2 text-center md:text-left">
                <h2 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                  <Gift className="w-6 h-6 animate-bounce" />
                  Hadiah Harian
                </h2>
                <p className="text-blue-100 text-sm">
                  Selesaikan misi untuk mendapatkan Gems dan XP Booster!
                </p>
              </div>
              <div className="text-6xl">🎁</div>
            </div>
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-8 -mt-8 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          </div>

          {/* LIST GOALS */}
          <div className="grid gap-4">
            <AnimatePresence>
              {dailyGoals.map((goal: any) => {
                const isClaimable = goal.isCompleted && !goal.isClaimed;

                return (
                  <motion.div
                    key={goal.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`p-5 rounded-2xl border-2 transition-all duration-500 ${getGoalCardStyle(goal)}`}>
                      <div className="flex items-center gap-4">
                        {/* Icon Box */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl transition-all duration-500 ${getGoalIconBoxStyle(goal)}`}>
                          <GoalIcon goal={goal} />
                        </div>

                        {/* Content Progress */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className={`font-bold text-lg truncate transition-colors duration-500 ${goal.isClaimed ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>
                              {goal.title}
                            </h3>
                            <span className="text-sm font-bold text-zinc-500">
                              {goal.current} / {goal.target}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                            <motion.div
                              className={`h-full rounded-full transition-colors duration-500 ${getGoalProgressBarStyle(goal)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        {/* Button Action / Reward Preview */}
                        <div className="shrink-0 w-28 flex justify-end">
                          {goal.isClaimed ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-zinc-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" /> Terklaim
                            </motion.div>
                          ) : isClaimable ? (
                            <Button
                              onClick={() => handleClaim(goal.id)}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-200 transition-transform active:scale-95 group relative overflow-hidden"
                            >
                              <span className="relative z-10">Klaim</span>
                              <div className="absolute inset-0 bg-white/20 w-full h-full -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                            </Button>
                          ) : (
                            // Tampilan Hadiah (Belum Selesai)
                            <div className="flex flex-col items-center justify-center gap-1 text-zinc-400">
                              <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                {goal.rewardType === 'gem' ? <Gem className="w-4 h-4 text-blue-400" /> : <Zap className="w-4 h-4 text-purple-400" />}
                              </div>
                              <div className="text-[10px] font-bold uppercase text-zinc-500">
                                {goal.rewardType === 'gem' ? `+${goal.rewardValue} Gems` : `${goal.rewardValue}m 2x XP`}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>


        {/* =========================================
            KOLOM KANAN: STATISTIK STREAK & SIDEBAR
           ========================================= */}
        <div className="flex flex-col gap-6">

          {/* Streak Calendar Card */}
          <Card className="p-6 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Streak Kamu</h3>
              <div className="flex items-center gap-1 text-orange-500 font-bold">
                <Flame className="w-5 h-5 fill-current" /> {streak}
              </div>
            </div>

            {/* Row Hari Senin-Minggu - Clickable Preview */}
            <div 
              className="flex justify-between items-center mb-6 cursor-pointer group/cal p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              <div className="flex flex-1 justify-between items-center">
                {streakHistory.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className={`text-xs font-bold uppercase ${item.isToday ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                      {item.day}
                    </span>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${item.active
                        ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                        : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-transparent'
                      }`}>
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center ml-4 text-zinc-300 group-hover/cal:text-orange-500 transition-colors border-l pl-4 dark:border-zinc-800">
                <ChevronRightIcon className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase mt-1">Detail</span>
              </div>
            </div>

            {/* Weekly Reward Box Container */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Set Target:</span>
                    {isWeeklyTargetLocked && (
                      <span className="text-[9px] text-orange-500 font-bold uppercase">Terkunci Minggu Ini</span>
                    )}
                  </div>
                  <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                    {[3, 5, 7].map((t) => (
                      <button
                        key={t}
                        disabled={isWeeklyTargetLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isWeeklyTargetLocked) setTargetToConfirm(t);
                        }}
                        className={`px-3 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                          weeklyTarget === t 
                            ? "bg-white dark:bg-zinc-700 text-orange-600 shadow-sm" 
                            : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        } ${isWeeklyTargetLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {t} HARI
                      </button>
                    ))}
                  </div>
                </div>

                {/* Peringatan Teks Kecil */}
                {!isWeeklyTargetLocked && (
                  <p className="text-[10px] text-zinc-400 italic">
                    *Pilih target dengan bijak, tidak bisa diubah minggu ini.
                  </p>
                )}
              </div>

              <ConfirmModal
                isOpen={targetToConfirm !== null}
                onClose={() => setTargetToConfirm(null)}
                onConfirm={() => {
                  if (targetToConfirm) setWeeklyTarget(targetToConfirm);
                }}
                title="Konfirmasi Target"
                message={`Apakah Anda yakin ingin menetapkan target ${targetToConfirm} hari untuk minggu ini? Setelah dikonfirmasi, target tidak dapat diubah lagi.`}
                confirmText="Ya, Saya Yakin"
                cancelText="Pikirkan Lagi"
                variant="warning"
              />

              <div
                className={`text-center p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${activeDaysThisWeek >= weeklyTarget && !weeklyRewardClaimed
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 cursor-pointer hover:bg-orange-100 dark:hover:hover:bg-orange-900/40 shadow-lg shadow-orange-200 dark:shadow-none'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent'
                  }`}
                onClick={() => {
                  if (activeDaysThisWeek >= weeklyTarget && !weeklyRewardClaimed) {
                    claimWeeklyReward();
                    triggerConfetti();
                    playCoinSound();
                  }
                }}
              >
                <h4 className={`font-bold ${activeDaysThisWeek >= weeklyTarget && !weeklyRewardClaimed ? 'text-orange-700 dark:text-orange-400' : 'text-zinc-700 dark:text-zinc-300'}`}>Target Mingguan</h4>
                <p className="text-xs text-zinc-500 mb-1">Aktif {weeklyTarget} hari dalam minggu ini ({activeDaysThisWeek}/{weeklyTarget})</p>
                <div className="flex items-center justify-center gap-1.5 mb-3">
                  <Gem className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Hadiah: {weeklyTarget === 3 ? '50' : weeklyTarget === 5 ? '100' : '200'} Gems
                  </span>
                </div>

                <div className="flex flex-col gap-3 items-center justify-center">
                  <div className="flex items-center gap-2 w-full justify-center">
                    <div className="h-10 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                      <div className="bg-orange-400 h-full transition-all duration-1000 relative" style={{ width: `${weeklyProgress}%` }}>
                        {activeDaysThisWeek >= weeklyTarget && <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]" />}
                      </div>
                    </div>
                    <Gift className={`w-8 h-8 shrink-0 transition-all duration-300 ${weeklyRewardClaimed ? 'text-zinc-300' :
                        activeDaysThisWeek >= weeklyTarget ? 'text-orange-500 animate-bounce drop-shadow-md' : 'text-zinc-400'
                      }`} />
                  </div>

                  {weeklyRewardClaimed && (
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-1 mt-1">
                      <CheckCircle className="w-4 h-4" /> Hadiah Mingguan Terklaim
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

           {/* Monthly Challenge Badge - Enhanced UI */}
          <Card 
            className={`group relative p-0 rounded-3xl border-2 overflow-hidden transition-all duration-500 ${
              monthlyProgress >= 100 && !monthlyRewardClaimed
                ? 'border-purple-400 shadow-xl shadow-purple-500/20 scale-[1.02]'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
            onClick={() => {
              if (monthlyProgress >= 100 && !monthlyRewardClaimed) {
                claimMonthlyReward();
                triggerConfetti();
                playCoinSound();
              }
            }}
          >
            {/* Background Pattern/Gradient */}
            <div className={`absolute inset-0 opacity-10 pointer-events-none ${
              monthlyRewardClaimed ? 'bg-zinc-500' : 'bg-linear-to-br from-purple-600 via-indigo-600 to-pink-600'
            }`} />
            
            <div className="flex flex-col relative z-10">
              {/* Top Row: Icon and Progress Info */}
              <div className="flex items-center gap-4 p-5">
                <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 ${
                  monthlyRewardClaimed 
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400' 
                    : monthlyProgress >= 100 
                      ? 'bg-linear-to-br from-purple-500 to-indigo-600 text-white shadow-lg' 
                      : 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                }`}>
                  {monthlyRewardClaimed ? <CheckCircle className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
                  {monthlyProgress >= 100 && !monthlyRewardClaimed && (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-md"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col mb-1">
                    <span className="text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest">Tantangan Bulanan</span>
                    <h4 className={`font-black text-xl leading-tight ${monthlyRewardClaimed ? 'text-zinc-400' : 'text-zinc-800 dark:text-white'}`}>
                      {now.toLocaleString('id-ID', { month: 'long' })} Elite
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500">
                      <Clock className="w-3 h-3" />
                      {daysLeft} Hari Lagi
                    </div>
                    {monthlyRewardClaimed && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-[10px] font-bold">
                        <Check className="w-3 h-3" /> SELESAI
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar Area */}
              <div className="px-5 pb-2">
                <div className="flex justify-between items-end mb-2">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">Progres XP</span>
                      <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">{currentMonthlyXp.toLocaleString()} <span className="text-zinc-400 font-bold">/ {monthlyTarget.toLocaleString()}</span></span>
                   </div>
                   <span className={`text-sm font-black ${monthlyRewardClaimed ? 'text-zinc-400' : 'text-purple-600'}`}>{Math.floor(monthlyProgress)}%</span>
                </div>
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-50 dark:border-zinc-800 shadow-inner p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${monthlyProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full rounded-full relative ${
                      monthlyRewardClaimed ? 'bg-zinc-400' : 'bg-linear-to-r from-purple-500 via-indigo-500 to-purple-600'
                    }`} 
                  >
                    {!monthlyRewardClaimed && (
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Reward Preview Footer */}
              <div className={`mt-4 p-4 flex items-center justify-between border-t transition-colors ${
                monthlyRewardClaimed 
                  ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800' 
                  : monthlyProgress >= 100 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800' 
                    : 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-100 dark:border-zinc-800'
              }`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-xl ${monthlyRewardClaimed ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-800 shadow-sm'}`}>
                      <Gem className={`w-5 h-5 ${monthlyRewardClaimed ? 'text-zinc-400' : 'text-blue-500 fill-current'}`} />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Hadiah Spesial</span>
                      <span className={`text-sm font-black ${monthlyRewardClaimed ? 'text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>500 Gems</span>
                   </div>
                </div>
                
                {monthlyProgress >= 100 && !monthlyRewardClaimed ? (
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl animate-bounce shadow-lg shadow-purple-200 dark:shadow-none">
                    Klaim Sekarang
                  </Button>
                ) : (
                  <div className="text-[10px] font-bold text-zinc-400 uppercase italic">
                    {monthlyRewardClaimed ? 'Hadiah Terambil' : 'Belum Memenuhi Syarat'}
                  </div>
                )}
              </div>
            </div>
          </Card>

        </div>
      </div>

      <StreakCalendarModal 
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        activityHistory={activityHistory}
        streak={streak}
      />

      {/* --- DEBUG TOOL (Dev Only) --- */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2 scale-75 origin-bottom-left opacity-20 hover:opacity-100 transition-opacity">
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 p-4 rounded-3xl shadow-2xl">
            <p className="text-[10px] font-bold text-zinc-400 mb-3 uppercase tracking-widest text-center">Animation Tester</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" className="text-[10px] h-8" onClick={() => useUserStore.getState().triggerReward('xp', 15)}>
                Test XP Anim
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-8" onClick={() => useUserStore.getState().triggerReward('gem', 15)}>
                Test Gem Anim
              </Button>
              <Button size="sm" variant="outline" className="text-[10px] h-8 text-orange-600 border-orange-200" onClick={() => {
                useUserStore.setState({ isWeeklyTargetLocked: false });
                window.location.reload();
              }}>
                Force Unlock Target
              </Button>
              <Button size="sm" variant="ghost" className="text-[10px] h-8 text-red-500" onClick={() => {
                // Re-lock target for testing modal (only works if not already locked in store)
                // Just for testing UI state
                window.location.reload();
              }}>
                Reload State
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}