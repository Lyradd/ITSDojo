"use client";

import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/lib/evaluation-store';
import { Trophy, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  index: number;
  onProfileClick?: (entry: LeaderboardEntry) => void;
}

export function LeaderboardEntryComponent({ entry, index, onProfileClick }: LeaderboardEntryProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [rankChange, setRankChange] = useState<'up' | 'down' | 'same'>('same');

  useEffect(() => {
    if (entry.previousRank && entry.previousRank !== entry.rank) {
      setIsAnimating(true);
      
      if (entry.rank < entry.previousRank) {
        setRankChange('up');
      } else if (entry.rank > entry.previousRank) {
        setRankChange('down');
      }
      
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [entry.rank, entry.previousRank]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" fill="currentColor" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" fill="currentColor" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" fill="currentColor" />;
    return null;
  };

  const getRankChangeIcon = () => {
    if (rankChange === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rankChange === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: isAnimating && rankChange === 'up' 
          ? "0 0 25px rgba(234, 179, 8, 0.6)" 
          : "0 0 0px rgba(0,0,0,0)",
        borderColor: isAnimating && rankChange === 'up' ? "rgba(234, 179, 8, 1)" : undefined
      }}
      onClick={() => onProfileClick && onProfileClick(entry)}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 cursor-pointer",
        entry.isCurrentUser 
          ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-100 dark:shadow-blue-900/20" 
          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
        isAnimating && rankChange === 'down' && "scale-95 opacity-50",
        isAnimating && rankChange === 'up' && "scale-[1.02] bg-yellow-50 dark:bg-yellow-900/20 z-10 relative",
        entry.isCurrentUser && !isAnimating && "animate-pulse-glow",
        "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
      )}
    >
      {/* Rank Number */}
      <div className="flex items-center gap-2 w-12">
        <div className={cn(
          "font-bold text-lg",
          entry.rank <= 3 ? "text-transparent bg-clip-text bg-linear-to-r" : "text-zinc-500 dark:text-zinc-400",
          entry.rank === 1 && "from-yellow-400 to-yellow-600",
          entry.rank === 2 && "from-gray-300 to-gray-500",
          entry.rank === 3 && "from-amber-500 to-amber-700"
        )}>
          {entry.rank}
        </div>
        {getMedalIcon(entry.rank)}
      </div>

      {/* Avatar */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
        entry.avatar,
        entry.isCurrentUser && "ring-2 ring-blue-400 ring-offset-2"
      )}>
        {entry.name.charAt(0).toUpperCase()}
      </div>

      {/* Name & Stats Section */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <div className={cn(
            "font-black text-sm md:text-base truncate",
            entry.isCurrentUser ? "text-blue-600 dark:text-blue-400" : "text-zinc-800 dark:text-zinc-100"
          )}>
            {entry.name}
          </div>
          {entry.isCurrentUser && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full shadow-sm shrink-0">
              YOU
            </span>
          )}
        </div>

        {/* Dynamic Stats Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {entry.batch && (
            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[9px] font-bold rounded border border-zinc-200 dark:border-zinc-700 shrink-0">
              {entry.batch}
            </span>
          )}
          <div 
            className="relative flex items-center justify-center px-2 py-0.5 bg-green-50 group-hover:bg-blue-50 dark:bg-green-950/30 dark:group-hover:bg-blue-950/30 text-green-600 group-hover:text-blue-600 dark:text-green-400 dark:group-hover:text-blue-400 rounded-md border border-green-100 group-hover:border-blue-200 dark:border-green-900/50 dark:group-hover:border-blue-800/50 transition-all shrink-0 overflow-hidden min-h-[22px] z-10"
          >
            {/* Default View (Akurasi) */}
            <div className="flex items-center gap-1 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-full absolute">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-black">{entry.accuracy}% <span className="hidden sm:inline">Akurasi</span></span>
            </div>
            
            {/* Hover View (Klik Info) */}
            <div className="flex items-center gap-1 transition-all duration-300 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 relative">
              <span className="text-[9px] font-bold whitespace-nowrap">Lihat Profil Radar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action/Score Section */}
      <div className="flex items-center gap-3 shrink-0">
        {/* XP Score Badge */}
        <div className="flex flex-col items-end justify-center min-w-[70px]">
          <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 rounded-xl border-2 border-yellow-200/50 dark:border-yellow-900/50 shadow-sm group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" fill="currentColor" />
            <span className="font-black text-lg text-yellow-700 dark:text-yellow-400 leading-none">{entry.score}</span>
          </div>
          
          {entry.previousRank && entry.previousRank !== entry.rank && (
            <div className="flex items-center gap-1 px-1 mt-0.5">
              {getRankChangeIcon()}
              <span className={cn(
                "font-black text-[10px]",
                rankChange === 'up' && "text-green-600",
                rankChange === 'down' && "text-red-600"
              )}>
                {rankChange === 'up' && `+${entry.previousRank - entry.rank}`}
                {rankChange === 'down' && `-${entry.rank - entry.previousRank}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
