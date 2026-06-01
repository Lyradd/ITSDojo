"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, TrendingUp, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackToastProps {
  show: boolean;
  isCorrect: boolean;
  points: number;
  streak: number; // current streak setelah update
  streakBonus?: number; // XP bonus dari streak
}

// Pujian variasi sesuai streak
function praiseFor(streak: number): string {
  if (streak >= 10) return 'Tak Terbendung!';
  if (streak >= 7) return 'Luar Biasa!';
  if (streak >= 5) return 'Mantap! Streak Panas!';
  if (streak >= 3) return 'Keren! Lanjutkan!';
  if (streak >= 2) return 'Bagus!';
  return 'Tepat!';
}

function encouragementForWrong(): string {
  const messages = [
    'Tidak apa-apa, coba lagi!',
    'Hampir benar — tetap semangat!',
    'Belajar dari salah, lanjutkan!',
    'Yang penting tidak menyerah!',
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function FeedbackToast({ show, isCorrect, points, streak, streakBonus = 0 }: FeedbackToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className={cn(
              "flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border-2 backdrop-blur-md min-w-[320px]",
              isCorrect
                ? "bg-green-500/95 dark:bg-green-600/95 border-green-300 dark:border-green-400 text-white"
                : "bg-red-500/95 dark:bg-red-600/95 border-red-300 dark:border-red-400 text-white"
            )}
          >
            {isCorrect ? (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="bg-white/20 p-2 rounded-xl"
                >
                  <Sparkles className="w-6 h-6" fill="currentColor" />
                </motion.div>

                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-2xl font-black"
                    >
                      +{points}
                    </motion.span>
                    <span className="text-sm font-bold opacity-90">Poin</span>
                    {streakBonus > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xs font-bold bg-yellow-400/90 text-yellow-900 px-2 py-0.5 rounded-full ml-1 flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" fill="currentColor" />+{streakBonus} bonus
                      </motion.span>
                    )}
                  </div>
                  <div className="text-xs font-semibold opacity-90 mt-0.5">
                    {praiseFor(streak)}
                  </div>
                </div>

                {streak >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25, type: 'spring' }}
                    className="flex flex-col items-center bg-orange-400/90 text-orange-900 px-3 py-1.5 rounded-xl"
                  >
                    <div className="flex items-center gap-1">
                      <Flame className="w-4 h-4" fill="currentColor" />
                      <span className="text-lg font-black leading-none">{streak}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      streak
                    </span>
                  </motion.div>
                )}
              </>
            ) : (
              <>
                <div className="bg-white/20 p-2 rounded-xl">
                  <X className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-black">Belum Tepat</div>
                  <div className="text-xs font-semibold opacity-90 mt-0.5">
                    {encouragementForWrong()}
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 opacity-80" />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
