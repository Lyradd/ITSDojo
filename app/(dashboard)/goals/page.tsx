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
    weeklyActiveDays,
    claimedWeeklyMilestones,
    claimWeeklyMilestone,
    monthlyCompletedGoals,
    claimedMonthlyMilestones,
    claimMonthlyMilestone,
    streakFreezeCount,
    level
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const timeLeft = useMultiplierTimer();
  const [resetTimeLeft, setResetTimeLeft] = useState<string | null>(null);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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

    const historyEntry = activityHistory.find((h: any) => h.date === dateString);
    const hasActivity = historyEntry ? historyEntry.count > 0 : false;
    const isFreeze = historyEntry ? historyEntry.freezeUsed === true : false;
    return { day, active: hasActivity, isFreeze, isToday: index === todayIndex };
  });


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
                Misi
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
                  Hadiah Misi
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
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                      item.active
                        ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                        : item.isFreeze
                          ? 'bg-blue-100 border-blue-200 text-blue-500 dark:bg-blue-900/40 dark:border-blue-800 shadow-sm'
                          : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-transparent'
                      }`}>
                      {item.isFreeze ? <Snowflake className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center ml-4 text-zinc-300 group-hover/cal:text-orange-500 transition-colors border-l pl-4 dark:border-zinc-800">
                <ChevronRightIcon className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase mt-1">Detail</span>
              </div>
            </div>

            {/* Progressive Weekly Milestones */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-end mb-2">
                <div className="flex flex-col">
                  <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Misi Mingguan</h4>
                  <p className="text-xs text-zinc-500">Aktif {weeklyActiveDays} dari 7 hari minggu ini</p>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl pb-10">
                <div className="mx-4 relative h-8 mt-4">
                  {/* The Background Track & Filled Part */}
                  <div className="absolute inset-0 bg-zinc-200/50 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-linear-to-r from-orange-400 to-orange-500 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((weeklyActiveDays / 7) * 100, 100)}%` }}
                    >
                       <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>

                  {/* Milestones / Checkpoints */}
                  {[
                    { days: 3, reward: 50 },
                    { days: 5, reward: 100 },
                    { days: 7, reward: 200 }
                  ].map((milestone) => {
                    const isClaimed = claimedWeeklyMilestones.includes(milestone.days);
                    const isReached = weeklyActiveDays >= milestone.days;
                    const isAvailable = isReached && !isClaimed;
                    const positionPercent = (milestone.days / 7) * 100;

                    return (
                      <div 
                        key={milestone.days}
                        className="absolute top-1/2 flex flex-col items-center z-10"
                        style={{ left: `${positionPercent}%`, transform: 'translate(-50%, -50%)' }}
                      >
                         {/* Node */}
                         <div 
                           onClick={() => {
                             if (isAvailable) {
                               claimWeeklyMilestone(milestone.days);
                               triggerConfetti();
                               playCoinSound();
                             }
                           }}
                           className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                             isClaimed 
                               ? 'bg-zinc-100 border-zinc-200 text-green-500 dark:bg-zinc-800 dark:border-zinc-700'
                               : isAvailable
                                 ? 'bg-yellow-400 border-white dark:border-zinc-950 text-yellow-900 shadow-lg cursor-pointer hover:scale-110 animate-bounce'
                                 : isReached
                                    ? 'bg-orange-500 border-white dark:border-zinc-950 text-white' 
                                    : 'bg-white border-zinc-200 text-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-600'
                           }`}
                         >
                           {isClaimed ? <CheckCircle className="w-5 h-5" /> : <Gift className={`w-5 h-5 ${isAvailable ? 'fill-current' : ''}`} />}
                         </div>
                         {/* Labels */}
                         <div className="absolute top-11 flex flex-col items-center w-20">
                           <span className={`text-[10px] font-black uppercase tracking-wider ${isReached ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                             {milestone.days} Hari
                           </span>
                           <span className={`text-[9px] font-bold flex items-center gap-0.5 ${isClaimed ? 'text-zinc-400 line-through' : 'text-blue-500'}`}>
                             <Gem className="w-2.5 h-2.5" /> {milestone.reward}
                           </span>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          {/* Monthly Challenge Badge - Enhanced UI */}
          <Card className="group relative p-0 rounded-3xl border-2 overflow-hidden border-purple-200 dark:border-purple-900/30">
            {/* Background Pattern/Gradient */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-linear-to-br from-purple-600 via-indigo-600 to-pink-600" />

            <div className="flex flex-col relative z-10 p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 text-white shadow-lg flex items-center justify-center shrink-0">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-purple-500 dark:text-purple-400 uppercase tracking-widest truncate">Misi Bulanan</span>
                    <h4 className="font-black text-xl leading-tight text-zinc-800 dark:text-white truncate">
                      Misi {now.toLocaleString('id-ID', { month: 'long' })}
                    </h4>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate">Selesaikan Misi Harian</p>
                  </div>
                </div>
              </div>

              {/* Progressive Milestones - Horizontal Layout */}
              <div className="mt-4 p-4 bg-white/50 dark:bg-zinc-950/30 rounded-3xl border border-purple-100 dark:border-purple-900/30 pb-16">
                <div className="flex justify-between items-end mb-4 px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Progres Misi</span>
                    <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">{monthlyCompletedGoals} <span className="text-zinc-400 font-bold">/ 45 Misi</span></span>
                  </div>
                  <span className="text-sm font-black text-purple-600">{Math.floor(Math.min((monthlyCompletedGoals / 45) * 100, 100))}%</span>
                </div>

                <div className="mx-4 relative h-8 mt-6">
                  {/* The Background Track & Filled Part */}
                  <div className="absolute inset-0 bg-zinc-200/50 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-linear-to-r from-purple-400 to-purple-600 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((monthlyCompletedGoals / 45) * 100, 100)}%` }}
                    >
                       <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>

                  {/* Milestones / Checkpoints */}
                  {[
                    { target: 15, reward: 150, tier: 'bronze' },
                    { target: 30, reward: 300, tier: 'silver' },
                    { target: 45, reward: 500, tier: 'elite' }
                  ].map((milestone) => {
                    const isClaimed = claimedMonthlyMilestones.includes(milestone.target);
                    const isReached = monthlyCompletedGoals >= milestone.target;
                    const isAvailable = isReached && !isClaimed;
                    const positionPercent = (milestone.target / 45) * 100;

                    return (
                      <div 
                        key={milestone.target}
                        className="absolute top-1/2 flex flex-col items-center z-10"
                        style={{ left: `${positionPercent}%`, transform: 'translate(-50%, -50%)' }}
                      >
                         {/* Node */}
                         <div 
                           onClick={() => {
                             if (isAvailable) {
                               claimMonthlyMilestone(milestone.target, milestone.reward, milestone.tier);
                               triggerConfetti();
                               playCoinSound();
                             }
                           }}
                           className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-4 transition-all ${
                             isClaimed 
                               ? 'bg-zinc-100 border-zinc-200 text-green-500 dark:bg-zinc-800 dark:border-zinc-700'
                               : isAvailable
                                 ? 'bg-purple-500 border-white dark:border-zinc-950 text-white shadow-lg cursor-pointer hover:scale-110 animate-bounce'
                                 : isReached
                                    ? 'bg-purple-600 border-white dark:border-zinc-950 text-white' 
                                    : 'bg-white border-zinc-200 text-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-600'
                           }`}
                         >
                           {isClaimed ? <CheckCircle className="w-6 h-6" /> : (
                             milestone.target === 45 ? <Trophy className={`w-5 h-5 ${isAvailable ? 'fill-current' : ''}`} /> : <Gift className={`w-5 h-5 ${isAvailable ? 'fill-current' : ''}`} />
                           )}
                         </div>
                         {/* Labels */}
                         <div className="absolute top-14 flex flex-col items-center w-24">
                           <span className={`text-[10px] font-black uppercase tracking-wider ${isReached ? 'text-purple-600 dark:text-purple-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
                             {milestone.target} Misi
                           </span>
                           <span className={`text-[9px] font-bold flex items-center gap-0.5 ${isClaimed ? 'text-zinc-400 line-through' : 'text-blue-500'}`}>
                             <Gem className="w-2.5 h-2.5" /> {milestone.reward}
                           </span>
                         </div>
                      </div>
                    );
                  })}
                </div>
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

    </div>
  );
}