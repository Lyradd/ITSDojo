"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Zap, ShieldAlert, Crown, Gem, Clock, Store } from "lucide-react";
import { triggerConfetti } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";

export default function ShopPage() {
  const { gems, hasStreakFreeze, buyItem, multiplierEndTime } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleBuy = (type: 'freeze' | 'multiplier', cost: number) => {
    if (gems < cost) return;
    const success = buyItem(type, cost);
    if (success) {
      triggerConfetti();
    }
  };

  const isMultiplierActive = multiplierEndTime && multiplierEndTime > Date.now();

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-linear-to-r from-blue-700 to-cyan-600 rounded-3xl p-8 mb-10 shadow-xl shadow-blue-900/20 text-white relative overflow-hidden">
         {/* Dekorasi Latar */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
         <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />

         <div className="relative z-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center justify-center md:justify-start gap-3">
              <Store className="w-8 h-8" />
              Dojo Store
            </h1>
            <p className="text-blue-100 max-w-md">Gunakan saldo Gems Anda untuk membeli Power-Ups yang akan membantu proses belajar.</p>
         </div>

         {/* Saldo Gems */}
         <div className="relative z-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg cursor-default hover:bg-white/30 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-inner">
               <Gem className="w-7 h-7 text-cyan-200 fill-current" />
            </div>
            <div>
               <div className="text-3xl font-black tracking-tight"><AnimatedNumber value={gems} /></div>
               <div className="text-xs font-bold uppercase tracking-widest text-blue-100">Gems Tersedia</div>
            </div>
         </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-white flex items-center gap-2">
        <Crown className="w-6 h-6 text-yellow-500" /> 
        Power-Ups Spesial
      </h2>

      {/* GRID ITEM STORE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         
         {/* ITEM 1: STREAK FREEZE */}
         <Card className="flex flex-col rounded-3xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-md hover:shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
            <div className="p-6 md:p-8 flex-1 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-linear-to-b from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/10 flex items-center justify-center mb-6 shadow-sm border border-orange-100 dark:border-orange-900/50 relative">
                  <Flame className="w-12 h-12 text-orange-500" fill="currentColor" />
                  <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[1px] rounded-full" />
                  <ShieldAlert className="w-6 h-6 text-blue-500 absolute -bottom-1 -right-1 drop-shadow-md" />
               </div>
               
               <h3 className="text-xl font-bold mb-2">Streak Freeze</h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-1">
                 Kebakaran jenggot karena lupa belajar sehari? Item ini akan membekukan *streak* Anda agar tidak me-reset ke angka 0 saat Anda kelewatan satu hari.
               </p>
               
               <div className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mt-auto">
                  <div className="flex items-center gap-1.5 font-black text-xl text-blue-600 dark:text-blue-400">
                    <Gem className="w-5 h-5 fill-current" /> 150
                  </div>
                  
                  {hasStreakFreeze ? (
                     <Button disabled className="bg-zinc-200 text-zinc-500 dark:bg-zinc-800 font-bold rounded-xl px-6 opacity-80 border-2 border-transparent">
                        Dilengkapi
                     </Button>
                  ) : (
                     <Button 
                        onClick={() => handleBuy('freeze', 150)}
                        disabled={gems < 150}
                        className={`font-bold rounded-xl px-6 shadow-md border-2 border-transparent transition-transform hover:scale-105 active:scale-95 ${gems >= 150 ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                     >
                        Beli Item
                     </Button>
                  )}
               </div>
            </div>
         </Card>

         {/* ITEM 2: HAPPY HOUR */}
         <Card className="flex flex-col rounded-3xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-md hover:shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
            <div className="p-6 md:p-8 flex-1 flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-linear-to-b from-purple-100 to-purple-50 dark:from-purple-950/40 dark:to-purple-900/10 flex items-center justify-center mb-6 shadow-sm border border-purple-100 dark:border-purple-900/50">
                  <Zap className="w-12 h-12 text-purple-500" fill="currentColor" />
               </div>
               
               <h3 className="text-xl font-bold mb-2">XP Multiplier (1 Jam)</h3>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-1">
                 Aktifkan *Happy Hour*! Semua XP yang Anda dapatkan dari memecahkan soal atau menamatkan materi akan digandakan (x2) secara otomatis selama satu jam penuh.
               </p>
               
               <div className="w-full flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mt-auto">
                  <div className="flex items-center gap-1.5 font-black text-xl text-blue-600 dark:text-blue-400">
                    <Gem className="w-5 h-5 fill-current" /> 100
                  </div>
                  
                  {isMultiplierActive ? (
                     <Button disabled className="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 font-bold rounded-xl px-6 border-none flex gap-2 w-[116px]">
                        <Clock className="w-4 h-4 animate-spin-slow" /> Aktif
                     </Button>
                  ) : (
                     <Button 
                        onClick={() => handleBuy('multiplier', 100)}
                        disabled={gems < 100}
                        className={`font-bold rounded-xl px-6 shadow-md border-2 border-transparent transition-transform hover:scale-105 active:scale-95 ${gems >= 100 ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''}`}
                     >
                        Aktifkan
                     </Button>
                  )}
               </div>
            </div>
         </Card>

      </div>
    </div>
  );
}
