"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Flame, 
  CheckCircle, 
  Gift, 
  Zap, 
  BookOpen, 
  Trophy, 
  Gem,
  Clock
} from "lucide-react";
import { triggerSimpleConfetti } from "@/lib/utils";

export default function GoalsPage() {
  const { 
    dailyGoals, 
    streak, 
    claimGoalReward, 
    multiplierEndTime, 
    xpMultiplier 
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // 1. Cek Mounted 
  useEffect(() => { setIsMounted(true); }, []);

  // 2. Logika Timer Mundur untuk Multiplier
  useEffect(() => {
    if (!multiplierEndTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = multiplierEndTime - now;

      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [multiplierEndTime]);

  if (!isMounted) return null;

  // 3. Logika Mock Data Kalender Streak
  const days = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"];
  const todayIndex = new Date().getDay() - 1;
  
  const streakHistory = days.map((day, index) => {
    const isActive = index <= todayIndex && index > todayIndex - streak;
    return { day, active: isActive, isToday: index === todayIndex };
  });

  // 4. Wrapper Fungsi Klaim Hadiah
  const handleClaim = (goalId: string) => {
    claimGoalReward(goalId);
    triggerSimpleConfetti();
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        
        {/* =========================================
            KOLOM KIRI: DAFTAR MISI & BANNER
           ========================================= */}
        <div className="flex flex-col gap-6">
          
          {/* Header Page */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-zinc-800 dark:text-white">
              Misi Harian
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-xl font-bold">
               <Flame className="w-5 h-5 fill-current" />
               <span>{streak} Hari Streak</span>
            </div>
          </div>

          {/* BANNER 1: Active Boost */}
          {timeLeft && (
            <div className="animate-in slide-in-from-top-4 duration-500 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between">
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-lg">
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
             {dailyGoals.map((goal) => {
                const isClaimable = goal.isCompleted && !goal.isClaimed;

                return (
                  <Card 
                    key={goal.id} 
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                      goal.isClaimed 
                        ? "bg-zinc-50 border-zinc-100 opacity-80 dark:bg-zinc-900 dark:border-zinc-800" 
                        : goal.isCompleted 
                          ? "border-green-400 bg-green-50 shadow-md ring-1 ring-green-200" 
                          : "border-zinc-200 hover:border-blue-300"
                    }`}
                  >
                     <div className="flex items-center gap-4">
                        {/* Icon Box */}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl transition-colors ${
                           goal.isClaimed ? 'bg-zinc-200 text-zinc-400' :
                           goal.isCompleted ? 'bg-green-500 text-white shadow-green-200' :
                           goal.type === 'xp' ? 'bg-blue-100 text-blue-500' : 'bg-purple-100 text-purple-500'
                        }`}>
                           {goal.isClaimed ? <CheckCircle className="w-8 h-8" /> : 
                            goal.type === 'xp' ? <Zap className="w-7 h-7 fill-current" /> : <BookOpen className="w-7 h-7" />}
                        </div>

                        {/* Content Progress */}
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <h3 className={`font-bold text-lg truncate ${goal.isClaimed ? 'text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                 {goal.title}
                              </h3>
                              <span className="text-sm font-bold text-zinc-500">
                                 {goal.current} / {goal.target}
                              </span>
                           </div>
                           
                           {/* Progress Bar */}
                           <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                              <div 
                                className={`h-full rounded-full transition-all duration-700 ease-out ${
                                  goal.isClaimed ? 'bg-zinc-400' : 
                                  goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                              />
                           </div>
                        </div>

                        {/* Button Action / Reward Preview */}
                        <div className="shrink-0 w-28 flex justify-end">
                           {goal.isClaimed ? (
                              <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                                 <CheckCircle className="w-3 h-3" /> Terklaim
                              </div>
                           ) : isClaimable ? (
                              <Button 
                                onClick={() => handleClaim(goal.id)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold animate-pulse shadow-lg shadow-green-200 transition-transform active:scale-95"
                              >
                                Klaim
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
                );
             })}
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
                       <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          item.active 
                            ? 'bg-orange-500 border-orange-600 text-white shadow-sm' 
                            : 'bg-transparent border-zinc-200 text-transparent'
                       }`}>
                          <CheckCircle className="w-5 h-5" />
                       </div>
                    </div>
                 ))}
              </div>

              {/* Weekly Reward Box */}
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                 <h4 className="font-bold text-zinc-700 dark:text-zinc-300">Target Mingguan</h4>
                 <p className="text-xs text-zinc-500 mb-3">Latih terus streakmu untuk hadiah spesial!</p>
                 <div className="flex items-center gap-2 justify-center">
                    <div className="h-10 w-full bg-zinc-200 rounded-full overflow-hidden flex">
                       <div className="w-[40%] bg-orange-400 h-full"></div>
                    </div>
                    <Gift className="w-8 h-8 text-zinc-400" />
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
                 <p className="text-xs text-zinc-500 mb-2">Kumpulkan 1000 XP bulan ini.</p>
                 <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[65%]" />
                 </div>
              </div>
           </Card>

        </div>
      </div>
    </div>
  );
}