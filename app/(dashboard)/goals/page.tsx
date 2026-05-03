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
  Snowflake
} from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { playCoinSound } from "@/lib/sounds";
import { useMultiplierTimer } from "@/hooks/use-multiplier-timer";

// --- Helper Functions for Goal Styling ---
const getGoalCardStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-50 border-zinc-100 opacity-60 dark:bg-zinc-900/50 dark:border-zinc-800 grayscale-[0.5]";
  if (goal.isCompleted) return "border-green-400 bg-green-50 shadow-md ring-1 ring-green-200";
  return "border-zinc-200 hover:border-blue-300";
};

const getGoalIconBoxStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-200 text-zinc-400 scale-95";
  if (goal.isCompleted) return "bg-green-500 text-white shadow-green-200 scale-110";
  if (goal.type === "xp") return "bg-blue-100 text-blue-500";
  return "bg-purple-100 text-purple-500";
};

const getGoalProgressBarStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-400";
  if (goal.isCompleted) return "bg-green-500";
  return "bg-blue-500";
};

const GoalIcon = ({ goal }: { goal: any }) => {
  if (goal.isClaimed) return <CheckCircle className="w-8 h-8" />;
  if (goal.type === "xp") return <Zap className="w-7 h-7 fill-current" />;
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
    streakFreezeCount
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const timeLeft = useMultiplierTimer();
  const [resetTimeLeft, setResetTimeLeft] = useState<string | null>(null);

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

  // Hitung Weekly Target (Contoh: Aktif 3 Hari seminggu)
  const activeDaysThisWeek = streakHistory.filter(h => h.active).length;
  const weeklyTarget = 3;
  const weeklyProgress = Math.min((activeDaysThisWeek / weeklyTarget) * 100, 100);

  // Hitung Monthly Challenge (Contoh: 1000 XP)
  const monthlyTarget = 1000;
  const monthlyProgress = Math.min(((xp % monthlyTarget) / monthlyTarget) * 100, 100);
  const currentMonthlyXp = xp % monthlyTarget;

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
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-xl font-bold text-sm" title={`${streakFreezeCount} Streak Freeze Aktif`}>
                  <Snowflake className="w-4 h-4" />
                  <span>{streakFreezeCount}</span>
                </div>
              )}

              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-bold">
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
                              <div className="p-1.5 bg-zinc-100 rounded-lg">
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

            {/* Row Hari Senin-Minggu */}
            <div className="flex justify-between items-center mb-6">
              {streakHistory.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <span className={`text-xs font-bold uppercase ${item.isToday ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                    {item.day}
                  </span>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${item.active
                      ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                      : 'bg-transparent border-zinc-200 text-transparent'
                    }`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Weekly Reward Box */}
            <div
              className={`text-center p-4 rounded-xl transition-all duration-300 relative overflow-hidden ${activeDaysThisWeek >= weeklyTarget && !weeklyRewardClaimed
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 shadow-lg shadow-orange-200 dark:shadow-none'
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
              <p className="text-xs text-zinc-500 mb-3">Aktif {weeklyTarget} hari dalam minggu ini ({activeDaysThisWeek}/{weeklyTarget})</p>
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

                {activeDaysThisWeek >= weeklyTarget && !weeklyRewardClaimed && (
                  <div className="text-sm font-bold text-orange-600 animate-pulse mt-1">
                    Tap untuk klaim 100 Gems!
                  </div>
                )}

                {weeklyRewardClaimed && (
                  <div className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center gap-1 mt-1">
                    <CheckCircle className="w-4 h-4" /> Hadiah Mingguan Terklaim
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Monthly Challenge Badge */}
          <Card className="p-0 rounded-2xl border-2 overflow-hidden flex flex-row">
            <div className="w-24 bg-purple-100 flex items-center justify-center text-purple-600">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="p-4 flex-1">
              <h4 className="font-bold text-sm text-zinc-700">Tantangan Bulanan</h4>
              <p className="text-xs text-zinc-500 mb-2">Kumpulkan {monthlyTarget} XP ({currentMonthlyXp}/{monthlyTarget})</p>
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${monthlyProgress}%` }} />
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}