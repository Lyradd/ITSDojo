"use client";

import React from "react";
import { useUserStore } from "@/lib/store";
import { Flame, Snowflake, Shield } from "lucide-react";
import { StatWidget } from "./stat-widget";

interface StreakDisplayProps {
  variant: "navbar" | "stat-widget" | "goals-badge" | "goals-simple" | "profile-card";
  hoverContent?: React.ReactNode;
}

export function StreakDisplay({ variant, hoverContent }: StreakDisplayProps) {
  const { streak, streakFreezeCount, lastActiveDate, activityHistory } = useUserStore();
  
  const todayDate = new Date();
  const todayStr = todayDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const hasLearnedToday = lastActiveDate === todayStr;

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Cari apakah kemarin beku
  const yesterdayActivity = activityHistory?.find((h: any) => h.date === yesterdayStr);
  const wasYesterdayFrozen = yesterdayActivity?.freezeUsed === true;
  
  // Prioritas Rendering:
  const isActiveToday = hasLearnedToday;
  const isFrozenState = !hasLearnedToday && wasYesterdayFrozen && streak > 0;
  
  // Indikator perlindungan (Tameng) muncul jika punya item TAPI hari ini sudah belajar (Api tetap merah)
  const isProtected = streakFreezeCount > 0 && hasLearnedToday;

  const fireColorClass = isFrozenState 
    ? "text-cyan-500" 
    : isActiveToday ? "text-orange-500" : "text-zinc-400";

  const fireBgClass = isFrozenState
    ? "bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950/40 dark:border-cyan-800 dark:text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
    : isActiveToday
      ? "bg-orange-50 border-orange-200 text-orange-500 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
      : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500";

  if (variant === "navbar") {
    return (
      <div 
        className={`hidden md:flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-full border transition-all ${fireBgClass}`}
        title={isFrozenState ? "Streak terselamatkan oleh Freeze" : `${streak} Hari Streak`}
      >
        {isFrozenState ? (
          <div className="relative">
            <Snowflake className="h-4 w-4 text-cyan-500 fill-current animate-pulse" />
          </div>
        ) : (
          <div className="relative">
            <Flame className={`h-4 w-4 ${isActiveToday ? "fill-current" : "fill-none"} ${fireColorClass}`} />
            {isProtected && <Shield className="h-2 w-2 absolute -bottom-1 -right-1 text-cyan-500 fill-current" />}
          </div>
        )}
        <span>{streak}</span>
      </div>
    );
  }

  if (variant === "stat-widget") {
    return (
      <StatWidget 
        align="center"
        icon={isFrozenState ? Snowflake : Flame} 
        color={fireColorClass} 
        label="Streak" 
        value={streak} 
        href="/goals" 
        hoverContent={hoverContent} 
      />
    );
  }

  if (variant === "goals-badge") {
    const badgeBg = isFrozenState 
      ? "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400" 
      : isActiveToday
        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
        
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${badgeBg}`}>
        {isFrozenState ? (
           <Snowflake className="w-5 h-5 animate-pulse text-cyan-500" />
        ) : (
          <div className="relative">
            <Flame className={`w-5 h-5 ${isActiveToday ? "fill-current" : "fill-none"} ${fireColorClass}`} />
            {isProtected && <Shield className="h-2.5 w-2.5 absolute -bottom-1 -right-1 text-cyan-500 fill-current" />}
          </div>
        )}
        <span>{streak} Hari Streak</span>
      </div>
    );
  }

  if (variant === "goals-simple") {
    return (
      <div className={`flex items-center gap-1 font-bold ${fireColorClass}`}>
        {isFrozenState ? <Snowflake className="w-5 h-5 animate-pulse text-cyan-500" /> : (
          <div className="relative">
            <Flame className={`w-5 h-5 ${isActiveToday ? "fill-current" : "fill-none"} ${fireColorClass}`} />
            {isProtected && <Shield className="h-2.5 w-2.5 absolute -bottom-1 -right-1 text-cyan-500 fill-current" />}
          </div>
        )} {streak}
      </div>
    );
  }

  if (variant === "profile-card") {
    if (isFrozenState) {
        return (
          <div className="relative flex items-center p-3 sm:p-4 bg-cyan-500 border-2 border-cyan-400 rounded-2xl gap-3 sm:gap-4 overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 text-white">
              <Snowflake className="w-full h-full animate-pulse" fill="currentColor" strokeWidth={1} />
            </div>
            <div className="flex flex-col z-10">
              <span className="text-lg sm:text-xl font-bold text-white leading-none mb-1">{streak}</span>
              <span className="text-xs sm:text-sm font-bold text-white/90">Hari Beruntun (Beku)</span>
            </div>
            <div className="absolute top-2 right-2 text-white/40">
              <Snowflake className="w-6 h-6 animate-[spin_4s_linear_infinite]" />
            </div>
          </div>
        );
    }
    
    if (isActiveToday) {
        return (
          <div className="relative flex items-center p-3 sm:p-4 bg-[#FFC800] border-2 border-[#FFC800] rounded-2xl gap-3 sm:gap-4 overflow-hidden">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 text-[#FF9600]">
              <Flame className="w-full h-full" fill="currentColor" strokeWidth={1} />
              {isProtected && <Shield className="w-4 h-4 sm:w-5 sm:h-5 absolute -bottom-1 -right-1 text-cyan-500 fill-current" />}
            </div>
            <div className="flex flex-col z-10">
              <span className="text-lg sm:text-xl font-bold text-white leading-none mb-1">{streak}</span>
              <span className="text-xs sm:text-sm font-bold text-white/90">Hari Beruntun</span>
            </div>
            <div className="absolute top-2 right-2 text-white/70">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
          </div>
        );
    }

    // Pending / Gray state (streak > 0 but not active, or streak == 0)
    return (
      <div className="relative flex items-center p-3 sm:p-4 bg-transparent border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl gap-3 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 text-zinc-300 dark:text-zinc-600">
          <Flame className="w-full h-full" fill="none" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col z-10">
          <span className="text-lg sm:text-xl font-bold text-zinc-800 dark:text-white leading-none mb-1">{streak}</span>
          <span className="text-xs sm:text-sm font-bold text-zinc-500">Hari Beruntun</span>
        </div>
      </div>
    );
  }

  return null;
}
