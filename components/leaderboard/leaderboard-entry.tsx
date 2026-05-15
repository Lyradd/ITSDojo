"use client";

import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/lib/evaluation-store';
import { Trophy, ArrowUp, ArrowDown, Minus, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  index: number;
}

export function LeaderboardEntryComponent({ entry, index }: LeaderboardEntryProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [rankChange, setRankChange] = useState<'up' | 'down' | 'same' | 'new'>('same');

  useEffect(() => {
    if (entry.previousRank) {
      if (entry.previousRank !== entry.rank) {
        setIsAnimating(true);
        if (entry.rank < entry.previousRank) {
          setRankChange('up');
        } else if (entry.rank > entry.previousRank) {
          setRankChange('down');
        }
        const timer = setTimeout(() => setIsAnimating(false), 1000);
        return () => clearTimeout(timer);
      } else {
        setRankChange('same');
      }
    } else {
       setRankChange('new');
    }
  }, [entry.rank, entry.previousRank]);

  // Accuracy Threshold Color
  let accClass = "bg-[#fcebeb] text-[#791f1f] dark:bg-red-900/30 dark:text-red-400"; // low
  if (entry.accuracy > 85) accClass = "bg-[#eaf3de] text-[#27500a] dark:bg-green-900/40 dark:text-green-400"; // high
  else if (entry.accuracy >= 70) accClass = "bg-[#faeeda] text-[#633806] dark:bg-yellow-900/40 dark:text-yellow-400"; // mid

  const rankStr = entry.rank === 1 ? "1 🏆" : entry.rank === 2 ? "2 🥈" : entry.rank === 3 ? "3 🥉" : `${entry.rank}`;

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "grid grid-cols-[40px_1fr_auto_auto_auto] gap-3 items-center p-3 border-b border-zinc-200 dark:border-zinc-800 transition-colors last:border-b-0",
        entry.isCurrentUser ? "bg-blue-50/50 dark:bg-blue-950/20" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
      )}
    >
      {/* Rank */}
      <div className="text-[15px] font-medium text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
        {rankStr}
      </div>

      {/* User */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0",
          entry.rank === 1 ? "bg-[#faae1a] text-[#2c2402]" :
          entry.rank === 2 ? "bg-[#d3d1c7] text-[#444441]" :
          entry.rank === 3 ? "bg-[#f0997b] text-[#4a1b0c]" :
          "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
        )}>
          {entry.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium text-zinc-900 dark:text-zinc-100 truncate mb-0.5">
            {entry.name}
          </div>
          <div className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
            Level {Math.floor((entry.score ?? 0) / 100) + 1}
          </div>
        </div>
      </div>

      {/* Accuracy */}
      <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-medium", accClass)}>
        <Check className="w-3.5 h-3.5" />
        {entry.accuracy}%
      </div>

      {/* XP */}
      <div className="flex items-center gap-1.5 font-medium text-[14px] text-zinc-900 dark:text-zinc-100 min-w-[60px] justify-end">
        <Zap className="w-4 h-4 text-[#faae1a] fill-current" />
        {entry.score}
      </div>

      {/* Trend */}
      <div className="min-w-[40px] flex justify-center">
        {rankChange === 'up' && (
          <div className="flex items-center gap-1 text-[12px] text-[#639922] dark:text-green-400 font-medium">
            <ArrowUp className="w-3 h-3" /> +{entry.previousRank! - entry.rank}
          </div>
        )}
        {rankChange === 'down' && (
          <div className="flex items-center gap-1 text-[12px] text-[#e24b4a] dark:text-red-400 font-medium">
            <ArrowDown className="w-3 h-3" /> -{entry.rank - entry.previousRank!}
          </div>
        )}
        {rankChange === 'same' && (
          <div className="flex items-center gap-1 text-[12px] text-zinc-400 font-medium">
            <Minus className="w-3 h-3" /> =
          </div>
        )}
        {rankChange === 'new' && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl text-[11px] font-medium tracking-wide">
            NEW
          </span>
        )}
      </div>
    </motion.div>
  );
}
