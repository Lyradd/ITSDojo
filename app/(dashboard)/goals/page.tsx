"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Check,
  Target
} from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { playCoinSound } from "@/lib/sounds";
import { claimDailyGoalAction, claimMonthlyMilestoneAction } from "@/actions/gamification";
import { useMultiplierTimer } from "@/hooks/use-multiplier-timer";
import dynamic from "next/dynamic";
import React from "react";
import { ChevronRight as ChevronRightIcon } from "lucide-react";
import { StreakDisplay } from "@/components/shared/streak-display";

const StreakCalendarModal = dynamic(() => import("@/components/shared/streak-calendar-modal").then(mod => mod.StreakCalendarModal), { ssr: false });
const ConfirmModal = dynamic(() => import("@/components/shared/confirm-modal").then(mod => mod.ConfirmModal), { ssr: false });

const ResetTimerText = React.memo(() => {
  const [resetTimeLeft, setResetTimeLeft] = useState<string | null>(null);

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
    const interval = setInterval(updateResetTime, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!resetTimeLeft) return null;

  return (
    <p className="text-sm font-medium text-zinc-500 flex items-center gap-1">
      <Clock className="w-4 h-4" /> Reset dalam {resetTimeLeft}
    </p>
  );
});

const MultiplierBanner = React.memo(() => {
  const timeLeft = useMultiplierTimer();
  const xpMultiplier = useUserStore(s => s.xpMultiplier);

  if (!timeLeft) return null;

  return (
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
  );
});

// --- Helper Functions for Goal Styling ---
const getGoalCardStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-50 border-zinc-100 opacity-60 dark:bg-zinc-900/50 dark:border-zinc-800 grayscale-[0.5]";
  if (goal.isCompleted) return "border-green-400 bg-green-50 shadow-md ring-1 ring-green-200 dark:bg-green-900/20 dark:border-green-600 dark:ring-green-800";
  return "border-zinc-200 dark:border-zinc-700";
};

const getGoalIconBoxStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-200 text-zinc-400 scale-95 dark:bg-zinc-700 dark:text-zinc-500";
  if (goal.isCompleted) return "bg-green-500 text-white shadow-green-200 scale-110 dark:shadow-green-900";
  if (goal.category === "academic") return "bg-blue-100 text-blue-500 dark:bg-blue-900/40 dark:text-blue-400";
  if (goal.category === "competitive") return "bg-orange-100 text-orange-500 dark:bg-orange-900/40 dark:text-orange-400";
  return "bg-purple-100 text-purple-500 dark:bg-purple-900/40 dark:text-purple-400";
};

const getGoalProgressBarStyle = (goal: any) => {
  if (goal.isClaimed) return "bg-zinc-400";
  if (goal.isCompleted) return "bg-green-500";
  return "bg-blue-500";
};

const GoalIcon = ({ goal }: { goal: any }) => {
  if (goal.isClaimed) return <CheckCircle className="w-8 h-8" />;
  if (goal.category === "academic") return <BookOpen className="w-7 h-7" />;
  if (goal.category === "competitive") return <Trophy className="w-7 h-7" />;
  return <Target className="w-7 h-7" />;
};

export default function GoalsPage() {
  const router = useRouter();
  const {
    dailyGoals,
    streak,
    multiplierEndTime,
    xpMultiplier,
    activityHistory,
    xp,
    getWeeklyActiveDays,
    claimedWeeklyMilestones,
    claimWeeklyMilestone,
    monthlyCompletedGoals,
    claimedMonthlyMilestones,
    streakFreezeCount,
    level,
    isLoggedIn
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const weeklyActiveDays = getWeeklyActiveDays();
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [claimingGoals, setClaimingGoals] = useState<Set<string>>(new Set());

  const [currentMonth, setCurrentMonth] = useState("");

  // 1. Cek Mounted 
  useEffect(() => {
    setIsMounted(true);
    setCurrentMonth(new Date().toLocaleString('id-ID', { month: 'long', timeZone: 'Asia/Jakarta' }));
  }, []);

  // Auth Guard redirect
  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  if (!isMounted || !isLoggedIn) return null;

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


  // 4. Wrapper Fungsi Klaim Hadiah dengan Anti-Eksploitasi (Debounce/Lock via Server Action)
  const handleClaim = async (goalId: string) => {
    if (claimingGoals.has(goalId)) return;
    setClaimingGoals(prev => new Set(prev).add(goalId));

    try {
      const res = await claimDailyGoalAction(goalId);
      if (res.success && res.gamificationData) {
        // Sync state from server response (OCC Safe)
        useUserStore.getState().syncFromServer({
          level: res.newLevel as number,
          profileXp: res.newXp as number,
          xp: res.newLeaderboardXp as number,
          gems: res.newGems as number,
          streak: useUserStore.getState().streak,
          accuracy: useUserStore.getState().accuracy,
          gamificationData: res.gamificationData
        });

        triggerConfetti();
        playCoinSound();
        useUserStore.getState().triggerReward('gem', Math.min(res.earnedGems as number, 10));
        if ((res.earnedXp as number) > 0) useUserStore.getState().triggerReward('xp', Math.min(res.earnedXp as number, 10));
      } else {
        console.error("Gagal klaim misi:", res.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setClaimingGoals(prev => {
          const newSet = new Set(prev);
          newSet.delete(goalId);
          return newSet;
        });
      }, 500);
    }
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
              <div className="flex items-center gap-3 mb-1">
                <Target className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-extrabold text-zinc-800 dark:text-white">
                  Misi
                </h1>
              </div>
              <ResetTimerText />
            </div>

            <div className="flex items-center gap-3">
              {/* Streak Freeze Indicator */}
              {streakFreezeCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl font-bold text-sm" title={`${streakFreezeCount} Streak Freeze Aktif`}>
                  <Snowflake className="w-4 h-4" />
                  <span>{streakFreezeCount}</span>
                </div>
              )}

              <StreakDisplay variant="goals-badge" />
            </div>
          </div>

          {/* BANNER 1: Active Boost */}
          <MultiplierBanner />

          {/* BANNER 2: Hadiah Harian Hero */}
          <div className="group relative overflow-hidden rounded-2xl bg-blue-600 dark:bg-blue-950/60 border border-blue-500/30 dark:border-blue-900/40 p-5 sm:p-6 shadow-md transition-all duration-300">
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
                  <h2 className="text-lg font-black text-white">
                    Hadiah Misi
                  </h2>
                </div>
                <p className="text-blue-100 dark:text-zinc-350 text-sm leading-relaxed max-w-lg">
                  Selesaikan misi harian untuk mengumpulkan Gems dan mendapatkan XP dari peti karun!
                </p>
              </div>

              {/* Chest Animation Visual */}
              <div className="shrink-0 flex items-center justify-center">
                <motion.div
                  className="relative w-28 h-28 flex items-center justify-center select-none"
                  whileHover="hover"
                >
                  {/* Glow behind the chest */}
                  <div className="absolute inset-0 bg-white/15 dark:bg-blue-400/10 rounded-full blur-xl animate-pulse" />

                  <svg width="90" height="90" viewBox="0 -15 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Gems and Zaps shooting out of the chest */}
                    <g>
                      {/* Gem */}
                      <motion.path
                        d="M32 32 L38 24 L44 32 L38 40 Z"
                        fill="#3B82F6"
                        animate={{
                          y: [-5, -28, -5],
                          opacity: [0, 1, 0],
                          scale: [0.6, 1, 0.6],
                          rotate: [0, 45, 90]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.2
                        }}
                      />
                      {/* Zap */}
                      <motion.path
                        d="M62 25 L56 33 L64 33 L58 42 L68 32 L60 32 Z"
                        fill="#F59E0B"
                        animate={{
                          y: [-10, -32, -10],
                          opacity: [0, 1, 0],
                          scale: [0.5, 0.9, 0.5],
                          rotate: [0, -20, 0]
                        }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 1.2
                        }}
                      />
                    </g>

                    {/* Chest Body (Cyber Crate) */}
                    <path
                      d="M25 58 L75 58 L75 80 L68 87 L32 87 L25 80 Z"
                      fill="#1E293B"
                      stroke="#475569"
                      strokeWidth="2.5"
                      className="dark:fill-zinc-800 dark:stroke-zinc-700"
                    />
                    {/* Cyber bands (Neon Cyan) */}
                    <rect x="34" y="58" width="4" height="29" fill="#06B6D4" opacity="0.6" className="dark:fill-blue-500" />
                    <rect x="62" y="58" width="4" height="29" fill="#06B6D4" opacity="0.6" className="dark:fill-blue-500" />
                    {/* Neon bottom corner highlights */}
                    <path d="M68 87 L75 80" stroke="#06B6D4" strokeWidth="2" opacity="0.8" className="dark:stroke-blue-500" />
                    <path d="M32 87 L25 80" stroke="#06B6D4" strokeWidth="2" opacity="0.8" className="dark:stroke-blue-500" />

                    {/* Central Cyber Lock/Scanner Core */}
                    <polygon points="44,58 50,51 56,58 50,65" fill="#0F172A" stroke="#06B6D4" strokeWidth="2" className="dark:stroke-blue-400" />
                    <circle cx="50" cy="58" r="3" fill="#06B6D4" className="dark:fill-blue-400 animate-pulse" />

                    {/* Chest Lid (Moving Lid on Hover) */}
                    <motion.g
                      variants={{
                        hover: {
                          y: -6,
                          rotate: -4,
                          transition: { duration: 0.3, ease: "easeInOut" }
                        }
                      }}
                      animate={{
                        y: [0, -2, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {/* Crate Lid */}
                      <path
                        d="M24 54 L32 36 L68 36 L76 54 Z"
                        fill="#334155"
                        stroke="#475569"
                        strokeWidth="2.5"
                        className="dark:fill-zinc-750 dark:stroke-zinc-600"
                      />
                      {/* Horizontal Neon Bar */}
                      <line x1="32" y1="45" x2="68" y2="45" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" className="dark:stroke-blue-400" />
                      {/* Cyber screws / hardware dots */}
                      <circle cx="36" cy="40" r="1.5" fill="#94A3B8" />
                      <circle cx="64" cy="40" r="1.5" fill="#94A3B8" />
                      {/* Lid bottom seal */}
                      <line x1="23" y1="54" x2="77" y2="54" stroke="#475569" strokeWidth="2.5" className="dark:stroke-zinc-650" />
                    </motion.g>
                  </svg>
                </motion.div>
              </div>
            </div>
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
                    <Card className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-500 ${getGoalCardStyle(goal)}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                        {/* Wrapper Icon & Progress untuk Mobile */}
                        <div className="flex items-center gap-3 sm:gap-4 w-full flex-1">
                          {/* Icon Box */}
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 text-xl sm:text-2xl transition-all duration-500 ${getGoalIconBoxStyle(goal)}`}>
                            <GoalIcon goal={goal} />
                          </div>

                          {/* Content Progress */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start sm:items-center mb-0.5 gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md ${goal.category === 'academic' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                                    goal.category === 'competitive' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' :
                                      'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
                                    }`}>
                                    {goal.category}
                                  </span>
                                  <h3 className={`font-bold text-sm sm:text-base line-clamp-1 break-words transition-colors duration-500 ${goal.isClaimed ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                    {goal.title}
                                  </h3>
                                </div>
                                <span className="text-xs font-bold text-zinc-500 shrink-0 whitespace-nowrap mt-0.5 sm:mt-0">
                                  {goal.currentProgress} / {goal.targetValue}
                                </span>
                              </div>
                              <p className={`text-xs sm:text-sm mb-2 sm:mb-2.5 line-clamp-2 break-words ${goal.isClaimed ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                {goal.description}
                              </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2.5 sm:h-3 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                              <motion.div
                                className={`h-full rounded-full origin-left ${getGoalProgressBarStyle(goal)}`}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: Math.min((goal.currentProgress / goal.targetValue), 1) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Button Action / Reward Preview */}
                        <div className="shrink-0 w-full sm:w-[140px] flex justify-end items-center h-12">
                          {goal.isClaimed ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-zinc-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center w-full gap-1"
                            >
                              <CheckCircle className="w-4 h-4 sm:w-3 sm:h-3" /> Terklaim
                            </motion.div>
                          ) : isClaimable ? (
                            <Button
                              onClick={() => handleClaim(goal.id)}
                              disabled={claimingGoals.has(goal.id)}
                              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-black shadow-[0_0_20px_rgba(34,197,94,0.6)] animate-[pulse_2s_infinite] transition-transform active:scale-95 group relative overflow-hidden disabled:opacity-50 disabled:active:scale-100"
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                {claimingGoals.has(goal.id) ? 'Klaim...' : (
                                  <>
                                    <Gift className="w-4 h-4" /> KLAIM
                                  </>
                                )}
                              </span>
                              {!claimingGoals.has(goal.id) && <span className="absolute inset-0 bg-white/30 w-full h-full -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />}
                            </Button>
                          ) : (
                            <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-1 text-zinc-400 w-full bg-zinc-50 dark:bg-zinc-900/30 sm:bg-transparent rounded-xl sm:rounded-none h-12">
                              <div className="flex items-center gap-2">
                                {goal.rewardXP > 0 && (
                                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                    <Zap className="w-3.5 h-3.5 text-purple-400 fill-current" />
                                    <span className="text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-300">+{goal.rewardXP}</span>
                                  </div>
                                )}
                                {goal.rewardGems > 0 && (
                                  <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                    <Gem className="w-3.5 h-3.5 text-blue-400 fill-current" />
                                    <span className="text-[10px] sm:text-xs font-bold text-zinc-600 dark:text-zinc-300">+{goal.rewardGems}</span>
                                  </div>
                                )}
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
          <Card className="p-4 sm:p-6 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Streak Kamu</h3>
              <StreakDisplay variant="goals-simple" />
            </div>

            {/* Row Hari Senin-Minggu - Clickable Preview */}
            <div
              className="flex justify-between items-center mb-6 cursor-pointer group/cal p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              onClick={() => setIsCalendarModalOpen(true)}
            >
              <div className="flex flex-1 justify-between items-center">
                {streakHistory.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 sm:gap-2">
                    <span className={`text-[10px] sm:text-xs font-bold uppercase ${item.isToday ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>
                      {item.day}
                    </span>
                    <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all ${item.active
                      ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                      : item.isFreeze
                        ? 'bg-blue-100 border-blue-200 text-blue-500 dark:bg-blue-900/40 dark:border-blue-800 shadow-sm'
                        : 'bg-transparent border-zinc-200 dark:border-zinc-800 text-transparent'
                      }`}>
                      {item.isFreeze ? <Snowflake className="w-3 h-3 sm:w-5 sm:h-5" /> : <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-center justify-center ml-2 sm:ml-4 text-zinc-300 group-hover/cal:text-orange-500 transition-colors border-l pl-2 sm:pl-4 dark:border-zinc-800 shrink-0">
                <ChevronRightIcon className="w-5 h-5" />
                <span className="text-[8px] font-bold uppercase mt-1 hidden sm:block">Detail</span>
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
                      className="absolute top-0 left-0 h-full w-full bg-linear-to-r from-orange-400 to-orange-500 transition-transform duration-1000 ease-out origin-left"
                      style={{ transform: `scaleX(${Math.min((weeklyActiveDays / 7), 1)})` }}
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
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${isClaimed
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
          <Card className="group relative p-0 rounded-3xl border-2 overflow-hidden border-blue-200 dark:border-blue-900/30">
            {/* Background Pattern/Gradient */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-blue-600" />

            <div className="flex flex-col relative z-10 p-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg flex items-center justify-center shrink-0">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest truncate">Misi Bulanan</span>
                    <h4 className="font-black text-xl leading-tight text-zinc-800 dark:text-white truncate">
                      Misi {currentMonth || "..."}
                    </h4>
                    <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate">Selesaikan Misi Harian</p>
                  </div>
                </div>
              </div>

              {/* Progressive Milestones - Horizontal Layout */}
              <div className="mt-4 p-4 bg-white/50 dark:bg-zinc-950/30 rounded-3xl border border-blue-100 dark:border-blue-900/30 pb-16">
                <div className="flex justify-between items-end mb-4 px-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Progres Misi</span>
                    <span className="text-sm font-black text-zinc-700 dark:text-zinc-200">{monthlyCompletedGoals} <span className="text-zinc-400 font-bold">/ 45 Misi</span></span>
                  </div>
                  <span className="text-sm font-black text-blue-600">{Math.floor(Math.min((monthlyCompletedGoals / 45) * 100, 100))}%</span>
                </div>

                <div className="mx-4 relative h-8 mt-6">
                  {/* The Background Track & Filled Part */}
                  <div className="absolute inset-0 bg-zinc-200/50 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-inner overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-1000 ease-out"
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
                          onClick={async () => {
                            if (isAvailable && !claimingGoals.has(`milestone-${milestone.target}`)) {
                              setClaimingGoals(prev => new Set(prev).add(`milestone-${milestone.target}`));
                              try {
                                const res = await claimMonthlyMilestoneAction(milestone.target, milestone.reward, milestone.tier);
                                if (res.success && res.gamificationData) {
                                  useUserStore.getState().syncFromServer({
                                    level: useUserStore.getState().level,
                                    profileXp: useUserStore.getState().xp,
                                    xp: useUserStore.getState().weeklyXp,
                                    gems: res.newGems as number,
                                    streak: useUserStore.getState().streak,
                                    accuracy: useUserStore.getState().accuracy,
                                    gamificationData: res.gamificationData
                                  });
                                  triggerConfetti();
                                  playCoinSound();
                                  useUserStore.getState().triggerReward('gem', Math.min(res.earnedGems as number, 15));
                                }
                              } catch (err) {
                                console.error("Milestone error:", err);
                              } finally {
                                setClaimingGoals(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(`milestone-${milestone.target}`);
                                  return newSet;
                                });
                              }
                            }
                          }}
                          className={`w-12 h-12 rounded-full flex flex-col items-center justify-center border-4 transition-all ${isClaimed
                            ? 'bg-zinc-100 border-zinc-200 text-green-500 dark:bg-zinc-800 dark:border-zinc-700'
                            : isAvailable
                              ? 'bg-blue-500 border-white dark:border-zinc-950 text-white shadow-lg cursor-pointer hover:scale-110 animate-bounce'
                              : isReached
                                ? 'bg-blue-600 border-white dark:border-zinc-950 text-white'
                                : 'bg-white border-zinc-200 text-zinc-300 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-600'
                            }`}
                        >
                          {isClaimed ? <CheckCircle className="w-6 h-6" /> : (
                            milestone.target === 45 ? <Trophy className={`w-5 h-5 ${isAvailable ? 'fill-current' : ''}`} /> : <Gift className={`w-5 h-5 ${isAvailable ? 'fill-current' : ''}`} />
                          )}
                        </div>
                        {/* Labels */}
                        <div className="absolute top-14 flex flex-col items-center w-24">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isReached ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
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