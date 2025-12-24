"use client";

import { useEffect, useState } from 'react';
import { useEvaluationStore } from '@/lib/evaluation-store';
import { LeaderboardEntryComponent } from './leaderboard-entry';
import { Card } from '@/components/ui/card';
import { Users, Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveLeaderboardProps {
  className?: string;
  showHeader?: boolean;
  maxEntries?: number;
}

export function LiveLeaderboard({ 
  className, 
  showHeader = true,
  maxEntries = 10 
}: LiveLeaderboardProps) {
  const { leaderboard, isLiveUpdateActive, userRank } = useEvaluationStore();
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (isLiveUpdateActive) {
      setIsLive(true);
      const interval = setInterval(() => {
        setIsLive(prev => !prev);
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setIsLive(false);
    }
  }, [isLiveUpdateActive]);

  // Show top entries + nearby entries for current user
  const getDisplayedEntries = () => {
    if (leaderboard.length <= maxEntries) {
      return leaderboard;
    }

    const topEntries = leaderboard.slice(0, 5);
    const currentUserEntry = leaderboard.find(e => e.isCurrentUser);
    
    if (!currentUserEntry || currentUserEntry.rank <= 5) {
      return leaderboard.slice(0, maxEntries);
    }

    // Show top 5 + current user + 2 nearby
    const userIndex = leaderboard.findIndex(e => e.isCurrentUser);
    const nearbyStart = Math.max(5, userIndex - 1);
    const nearbyEnd = Math.min(leaderboard.length, userIndex + 2);
    
    return [
      ...topEntries,
      ...leaderboard.slice(nearbyStart, nearbyEnd)
    ];
  };

  const displayedEntries = getDisplayedEntries();
  const totalParticipants = leaderboard.length;

  return (
    <Card className={cn("p-4 rounded-2xl border-2", className)}>
      {/* Header */}
      {showHeader && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Live Leaderboard
            </h3>
            
            {/* Live Indicator */}
            {isLiveUpdateActive && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-950/30 rounded-full border border-green-200 dark:border-green-800">
                <div className={cn(
                  "w-2 h-2 rounded-full bg-green-500 transition-opacity duration-300",
                  isLive ? "opacity-100" : "opacity-30"
                )} />
                <span className="text-xs font-bold text-green-600 dark:text-green-400">LIVE</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{totalParticipants} peserta</span>
            </div>
            {userRank > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Peringkat kamu: #{userRank}</span>
                </div>
              </>
            )}
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Update otomatis</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {displayedEntries.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada peserta</p>
          </div>
        ) : (
          displayedEntries.map((entry, index) => (
            <LeaderboardEntryComponent 
              key={entry.userId} 
              entry={entry} 
              index={index}
            />
          ))
        )}
      </div>

      {/* Show more indicator */}
      {leaderboard.length > maxEntries && displayedEntries.length < leaderboard.length && (
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            +{leaderboard.length - displayedEntries.length} peserta lainnya
          </p>
        </div>
      )}
    </Card>
  );
}
