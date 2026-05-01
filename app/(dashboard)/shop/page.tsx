"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Zap, ShieldAlert, Crown, Gem, Clock, Store, Briefcase, History, X, AlertCircle, Package, ShieldCheck, Lock, Dices, ChevronRight, Lightbulb, HelpCircle, Target, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { triggerConfetti } from "@/lib/confetti";
import { playCoinSound } from "@/lib/sounds";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { useMultiplierTimer } from "@/hooks/use-multiplier-timer";
import { SHOP_PRICES } from "@/lib/shop-config";

export default function ShopPage() {
  const { gems, streakFreezeCount, buyItem, multiplierEndTime, purchaseHistory = [] } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: string, cost: number, title: string, icon: React.ReactNode } | null>(null);
  const timeLeft = useMultiplierTimer();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const confirmBuy = () => {
    if (!selectedItem || gems < selectedItem.cost) return;
    const success = buyItem(selectedItem.type as any, selectedItem.cost);
    if (success) {
      triggerConfetti();
      playCoinSound();
      setSelectedItem(null);
    }
  };

  const isMultiplierActive = multiplierEndTime && multiplierEndTime > Date.now();

  const storeItems = [
    {
      id: 'freeze',
      title: 'Streak Freeze',
      description: 'Lupa belajar sehari? Item ini membekukan streak Anda agar tidak reset ke 0.',
      icon: <Flame className="w-10 h-10 text-orange-500" fill="currentColor" />,
      badge: <ShieldAlert className="w-5 h-5 text-blue-500 absolute -bottom-1 -right-1 drop-shadow-md" />,
      cost: SHOP_PRICES.STREAK_FREEZE,
      type: 'freeze',
      color: 'from-orange-100 to-orange-50 dark:from-orange-950/40 dark:to-orange-900/10',
      isFull: streakFreezeCount >= 3,
      fullText: 'Penuh (3/3)'
    },
    {
      id: 'shield-3x',
      title: 'Paket Shield (3x)',
      description: 'Beli paket hemat! Langsung isi penuh slot Streak Freeze Anda untuk perlindungan maksimal.',
      icon: <ShieldCheck className="w-10 h-10 text-green-500" />,
      cost: SHOP_PRICES.SHIELD_PACK,
      type: 'shield-3x',
      color: 'from-green-100 to-green-50 dark:from-green-950/40 dark:to-green-900/10',
      isFull: streakFreezeCount >= 3,
      fullText: 'Penuh (3/3)'
    },
    {
      id: 'multiplier',
      title: 'XP Booster (1 Jam)',
      description: 'Aktifkan Happy Hour! Semua XP yang didapatkan akan digandakan (x2) selama satu jam.',
      icon: <Zap className="w-10 h-10 text-purple-500" fill="currentColor" />,
      cost: SHOP_PRICES.XP_BOOSTER,
      type: 'multiplier',
      color: 'from-purple-100 to-purple-50 dark:from-purple-950/40 dark:to-purple-900/10',
      isActive: isMultiplierActive
    }
  ];

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

      {/* INVENTORY / TAS PENYIMPANAN */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-500" /> 
            Tas Penyimpanan
          </h2>
          <span className="text-sm font-medium text-zinc-500">Penyimpanan Aktif</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
           {/* Slot Streak Freeze */}
           <div className="bg-white dark:bg-zinc-950 border-2 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm group hover:border-orange-500/50 transition-colors">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-2xl flex items-center justify-center relative">
                 <Flame className="w-8 h-8" />
                 {streakFreezeCount > 0 && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-white dark:border-zinc-950 shadow-md">
                       {streakFreezeCount}
                    </div>
                 )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Freeze</p>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{streakFreezeCount}/3</p>
              </div>
           </div>

           {/* Slot XP Multiplier */}
           <div className="bg-white dark:bg-zinc-950 border-2 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm group hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-500 rounded-2xl flex items-center justify-center relative overflow-hidden">
                 <Zap className={`w-8 h-8 ${isMultiplierActive ? 'animate-pulse' : ''}`} />
                 {isMultiplierActive && (
                    <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
                 )}
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Booster</p>
                <p className="text-sm font-black text-zinc-800 dark:text-zinc-200">{isMultiplierActive ? timeLeft : 'Ready'}</p>
              </div>
           </div>

           {/* Locked Slot 1 */}
           <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 opacity-60">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center">
                 <Lock className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Locked</p>
           </div>

           {/* Locked Slot 2 */}
           <div className="bg-zinc-50 dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 flex flex-col items-center justify-center gap-2 opacity-60">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl flex items-center justify-center">
                 <Lock className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Locked</p>
           </div>
        </div>
      </div>

      {/* GEM EARNING GUIDE */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" /> 
          Cara Mendapatkan Gems
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <Card className="p-5 border-2 rounded-3xl bg-linear-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-zinc-950 shadow-sm border-blue-100 dark:border-blue-900/30">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                 <Store className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Selesaikan Pelajaran</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Setiap materi yang Anda selesaikan akan memberikan hadiah Gems langsung ke akun Anda.</p>
           </Card>

           <Card className="p-5 border-2 rounded-3xl bg-linear-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-zinc-950 shadow-sm border-orange-100 dark:border-orange-900/30">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-4">
                 <Target className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Target Harian</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Selesaikan 3 misi harian Anda untuk mendapatkan bonus Gems yang lebih besar setiap harinya.</p>
           </Card>

           <Card className="p-5 border-2 rounded-3xl bg-linear-to-br from-green-50 to-white dark:from-green-900/10 dark:to-zinc-950 shadow-sm border-green-100 dark:border-green-900/30">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center mb-4">
                 <Trophy className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Hadiah Mingguan</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Tetap aktif belajar selama seminggu penuh dan klaim peti hadiah mingguan di dashboard.</p>
           </Card>

           <Card className="p-5 border-2 rounded-3xl bg-linear-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-zinc-950 shadow-sm border-purple-100 dark:border-purple-900/30">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-4">
                 <Zap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-1">Naik Level</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">Terus kumpulkan XP untuk naik level! Setiap kenaikan level akan memberikan bonus Gems spesial.</p>
           </Card>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-white flex items-center gap-2">
        <Store className="w-6 h-6 text-blue-500" /> 
        Katalog Power-Ups
      </h2>

      {/* GRID ITEM STORE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {storeItems.map((item) => (
           <Card key={item.id} className="flex flex-col rounded-3xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all shadow-md hover:shadow-xl overflow-hidden bg-white dark:bg-zinc-900">
              <div className="p-6 md:p-8 flex-1 flex flex-col items-center text-center">
                 <div className={`w-24 h-24 rounded-full bg-linear-to-b ${item.color} flex items-center justify-center mb-6 shadow-sm border border-zinc-100 dark:border-zinc-800 relative`}>
                    {item.icon}
                    {item.badge}
                 </div>
                 
                 <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                 <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-1">
                   {item.description}
                 </p>
                 
                 <div className="w-full mt-auto">
                    <div className="w-full flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl mb-3">
                       <div className="flex items-center gap-1.5 font-black text-lg text-blue-600 dark:text-blue-400">
                         <Gem className="w-4 h-4 fill-current" /> {item.cost}
                       </div>
                       
                       {gems < item.cost && !item.isFull && !item.isActive && (
                         <div className="flex items-center gap-1 text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                            <AlertCircle className="w-3 h-3" /> Gem tidak cukup
                         </div>
                       )}
                    </div>
                    
                    {item.isFull ? (
                       <Button disabled className="w-full bg-zinc-200 text-zinc-500 dark:bg-zinc-800 font-bold rounded-xl h-11 opacity-80 border-none">
                          {item.fullText}
                       </Button>
                    ) : item.isActive ? (
                       <Button disabled className="w-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 font-bold rounded-xl h-11 border-none flex gap-2">
                          <Clock className="w-4 h-4 animate-spin-slow" /> Aktif
                       </Button>
                    ) : (
                       <Button 
                          onClick={() => setSelectedItem(item)}
                          disabled={gems < item.cost}
                          className={`w-full font-bold rounded-xl h-11 shadow-md transition-all active:scale-95 ${gems >= item.cost ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'}`}
                       >
                          {gems >= item.cost ? 'Beli Sekarang' : 'Gem Kurang'}
                       </Button>
                    )}
                 </div>
              </div>
           </Card>
         ))}
      </div>

      {/* RIWAYAT PEMBELIAN */}
      {purchaseHistory && purchaseHistory.length > 0 && (
         <div className="mt-12 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold mb-6 text-zinc-800 dark:text-white flex items-center gap-2">
               <History className="w-6 h-6 text-blue-500" /> 
               Riwayat Pembelian
            </h2>
            <Card className="rounded-2xl border-2 overflow-hidden shadow-sm bg-white dark:bg-zinc-950">
               <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {purchaseHistory.map((log) => (
                     <div key={log.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400">
                              {log.type === 'freeze' ? <Flame className="w-5 h-5 text-orange-500" /> : <Zap className="w-5 h-5 text-purple-500" />}
                           </div>
                           <div>
                              <p className="font-bold text-zinc-800 dark:text-zinc-200">{log.itemName}</p>
                              <p className="text-xs text-zinc-500">{new Date(log.date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-red-500">
                           <Gem className="w-4 h-4" /> -{log.cost}
                        </div>
                     </div>
                  ))}
               </div>
            </Card>
         </div>
      )}

      {/* CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border-2 border-zinc-100 dark:border-zinc-800"
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
              
              <div className="flex flex-col items-center text-center mt-4">
                 <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                    {selectedItem.icon}
                 </div>
                 <h3 className="text-2xl font-black mb-2 text-zinc-800 dark:text-white">Konfirmasi</h3>
                 <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                   Anda akan menukarkan <strong className="text-blue-500">{selectedItem.cost} Gems</strong> untuk membeli <strong className="text-zinc-800 dark:text-zinc-200">{selectedItem.title}</strong>. Lanjutkan?
                 </p>
                 
                 <div className="flex gap-3 w-full">
                    <Button 
                      variant="outline" 
                      className="flex-1 font-bold rounded-xl h-12"
                      onClick={() => setSelectedItem(null)}
                    >
                       Batal
                    </Button>
                    <Button 
                      className="flex-1 font-bold rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={confirmBuy}
                    >
                       Ya, Beli
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
