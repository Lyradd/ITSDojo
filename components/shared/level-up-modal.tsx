"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useUserStore } from "@/lib/store";
import { triggerConfetti } from "@/lib/confetti";
import { useEffect, useState } from "react";
import { Trophy, Star, ArrowRight, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LevelUpModal() {
  const { isLevelUpModalOpen, levelUpData, closeLevelUpModal } = useUserStore();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isLevelUpModalOpen) {
      // Trigger confetti immediately
      triggerConfetti();
      // Small delay for entrance animation
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isLevelUpModalOpen]);

  if (!isLevelUpModalOpen || !levelUpData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={closeLevelUpModal}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 40 }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.3)] border-2 border-blue-500/30"
        >
          {/* Header Visual */}
          <div className="h-32 bg-gradient-to-b from-blue-600 to-blue-500 flex items-center justify-center relative">
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center"
            >
              <Trophy className="w-10 h-10 text-blue-600" />
            </motion.div>
            
            {/* Enhanced Floating Stars & Twinkle Effect */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  y: [0, -20, 0],
                  x: [0, i % 2 === 0 ? 10 : -10, 0],
                  scale: [0.5, 1.2, 0.5],
                  opacity: [0.3, 1, 0.3],
                  rotate: [0, 180, 360]
                }}
                transition={{
                  duration: 3 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
                className="absolute"
                style={{
                  top: `${15 + (Math.random() * 60)}%`,
                  left: `${10 + (Math.random() * 80)}%`
                }}
              >
                <Star className={`fill-current ${i % 3 === 0 ? 'w-5 h-5 text-yellow-300' : i % 2 === 0 ? 'w-3 h-3 text-white' : 'w-4 h-4 text-blue-200'}`} />
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="p-8 pt-10 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter"
            >
              LEVEL UP!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-zinc-500 dark:text-zinc-400 font-medium mb-8"
            >
              Luar biasa! Kamu semakin mahir.
            </motion.p>

            {/* Level Comparison */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  {levelUpData.oldLevel}
                </div>
                <span className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">Level Lama</span>
              </div>
              
              <motion.div 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30"
              >
                <ArrowRight className="w-5 h-5 text-blue-500" />
              </motion.div>

              <div className="flex flex-col items-center">
                <motion.div 
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-2xl font-black text-white shadow-[0_10px_25px_rgba(59,130,246,0.5)] border-2 border-white/20"
                >
                  {levelUpData.newLevel}
                </motion.div>
                <span className="text-[10px] font-bold text-blue-500 mt-2 uppercase tracking-widest">Level Baru</span>
              </div>
            </div>

            {/* Rewards Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-5 mb-8 border border-blue-100 dark:border-blue-800/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Gem className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-3">Hadiah Anda</p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Gem className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-black text-zinc-800 dark:text-white">+{levelUpData.gemsGained} <span className="text-xl">Gems</span></span>
              </div>
            </motion.div>

            <Button 
              onClick={closeLevelUpModal}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.25rem] text-xl font-black shadow-[0_15px_30px_rgba(59,130,246,0.3)] transition-all hover:scale-[1.03] active:scale-95 group overflow-hidden relative"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Lanjutkan Pembelajaran <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
