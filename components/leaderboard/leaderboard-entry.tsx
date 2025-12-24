"use client";

import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@/lib/evaluation-store';
import { Trophy, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardEntryProps {
  entry: LeaderboardEntry;
  index: number;
}

export function LeaderboardEntryComponent({ entry, index }: LeaderboardEntryProps) {
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
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-all duration-500",
        entry.isCurrentUser 
          ? "bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-100 dark:shadow-blue-900/20" 
          : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800",
        isAnimating && "scale-105 shadow-xl",
        entry.isCurrentUser && "animate-pulse-glow"
      )}
    >
      {/* Rank Number */}
      <div className="flex items-center gap-2 w-12">
        <div className={cn(
          "font-bold text-lg",
          entry.rank <= 3 ? "text-transparent bg-clip-text bg-gradient-to-r" : "text-zinc-500 dark:text-zinc-400",
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

      {/* Name & Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "font-bold text-sm truncate",
            entry.isCurrentUser && "text-blue-600 dark:text-blue-400"
          )}>
            {entry.name}
          </div>
          {entry.isCurrentUser && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{entry.answeredQuestions}/{entry.totalQuestions} soal</span>
          <span>•</span>
          <span>{entry.accuracy}% akurasi</span>
        </div>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <Zap className="w-4 h-4 text-yellow-500" fill="currentColor" />
          <span className="font-bold text-lg">{entry.score}</span>
        </div>
        {entry.previousRank && entry.previousRank !== entry.rank && (
          <div className="flex items-center gap-1 text-xs">
            {getRankChangeIcon()}
            <span className={cn(
              "font-medium",
              rankChange === 'up' && "text-green-600",
              rankChange === 'down' && "text-red-600",
              rankChange === 'same' && "text-gray-500"
            )}>
              {rankChange === 'up' && `+${entry.previousRank - entry.rank}`}
              {rankChange === 'down' && `-${entry.rank - entry.previousRank}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
