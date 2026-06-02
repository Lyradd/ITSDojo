"use client";

import { useEffect, useState } from 'react';
import { useEvaluationStore } from '@/lib/evaluation-store';
import { LeaderboardEntryComponent } from './leaderboard-entry';
import { Card } from '@/components/ui/card';
import { Users, Activity, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { LeaderboardEntry } from '@/lib/evaluation-store';

// Ghost Bot Data
const GHOST_BOTS = [
  { name: 'Alex Bot', avatar: 'bg-blue-200 text-blue-700' },
  { name: 'Sarah AI', avatar: 'bg-pink-200 text-pink-700' },
  { name: 'Cyber Budi', avatar: 'bg-green-200 text-green-700' },
  { name: 'Neo Dinda', avatar: 'bg-purple-200 text-purple-700' },
  { name: 'Eko Synth', avatar: 'bg-indigo-200 text-indigo-700' },
  { name: 'Fajar X', avatar: 'bg-red-200 text-red-700' },
  { name: 'Gita 2.0', avatar: 'bg-orange-200 text-orange-700' },
  { name: 'Hendra Net', avatar: 'bg-teal-200 text-teal-700' },
  { name: 'Indah Web', avatar: 'bg-cyan-200 text-cyan-700' },
  { name: 'Joko Sys', avatar: 'bg-yellow-200 text-yellow-700' },
  { name: 'Kartika OS', avatar: 'bg-rose-200 text-rose-700' },
  { name: 'Lestari UX', avatar: 'bg-emerald-200 text-emerald-700' },
  { name: 'Miko Dev', avatar: 'bg-sky-200 text-sky-700' },
  { name: 'Nadia SQL', avatar: 'bg-fuchsia-200 text-fuchsia-700' },
  { name: 'Omar API', avatar: 'bg-violet-200 text-violet-700' },
  { name: 'Putri CSS', avatar: 'bg-pink-300 text-pink-800' },
  { name: 'Qory JS', avatar: 'bg-amber-200 text-amber-700' },
  { name: 'Rizki Go', avatar: 'bg-lime-200 text-lime-700' },
  { name: 'Siti Rust', avatar: 'bg-red-300 text-red-800' },
  { name: 'Tono Py', avatar: 'bg-blue-300 text-blue-800' },
  { name: 'Umar TS', avatar: 'bg-green-300 text-green-800' },
  { name: 'Vina C++', avatar: 'bg-purple-300 text-purple-800' },
  { name: 'Wira Ruby', avatar: 'bg-orange-300 text-orange-800' },
  { name: 'Xena PHP', avatar: 'bg-teal-300 text-teal-800' },
  { name: 'Yusuf Java', avatar: 'bg-indigo-300 text-indigo-800' },
];

interface LiveLeaderboardProps {
  className?: string;
  showHeader?: boolean;
  maxEntries?: number;
  onClose?: () => void;
}

export function LiveLeaderboard({ 
  className, 
  showHeader = true,
  maxEntries = 10,
  onClose
}: LiveLeaderboardProps) {
  const { leaderboard: realLeaderboard, isLiveUpdateActive, userRank, currentEvaluation } = useEvaluationStore();
  const [isLive, setIsLive] = useState(false);
  const [botLeaderboard, setBotLeaderboard] = useState<LeaderboardEntry[]>([]);

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

  // Inject Ghost Bots if real participants < botQuota
  useEffect(() => {
    const rawDesc = currentEvaluation?.description || "";
    const botMatch = rawDesc.match(/\[BOT_QUOTA:(\d+)\]/);
    const botQuota = botMatch ? parseInt(botMatch[1], 10) : 0;

    const neededBots = Math.max(0, botQuota - realLeaderboard.length);
    
    if (neededBots > 0) {
      const bots: LeaderboardEntry[] = Array.from({ length: neededBots }).map((_, i) => {
        const botData = GHOST_BOTS[i % GHOST_BOTS.length];
        
        // Buat score palsu biar kompetitif
        // Skor random antara 10 sampai 100 biar gerak-gerak
        const fakeScore = Math.floor(Math.random() * 50) + 20; 
        const fakeAccuracy = Math.floor(Math.random() * 60) + 40;

        return {
          userId: `bot-${i}`,
          name: botData.name,
          avatar: botData.avatar,
          score: fakeScore,
          totalQuestions: currentEvaluation?.questions.length || 10,
          answeredQuestions: Math.floor(Math.random() * 5) + 1,
          accuracy: fakeAccuracy,
          rank: 0, // Will be computed after combine
          lastUpdate: Date.now(),
        };
      });
      setBotLeaderboard(bots);
    } else {
      setBotLeaderboard([]);
    }
  }, [realLeaderboard.length, currentEvaluation, isLiveUpdateActive]); // Trigger whenever real length changes

  // Update bot scores slightly over time to make them look alive
  useEffect(() => {
    if (!isLiveUpdateActive || botLeaderboard.length === 0) return;
    const interval = setInterval(() => {
      setBotLeaderboard(prev => prev.map(bot => ({
        ...bot,
        // Naik 0-10 poin secara random setiap 5 detik
        score: bot.score + (Math.random() > 0.5 ? Math.floor(Math.random() * 10) : 0),
        lastUpdate: Date.now(),
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, [isLiveUpdateActive, botLeaderboard.length]);

  // Combine real and bot leaderboard, then sort
  const combinedLeaderboard = [...realLeaderboard, ...botLeaderboard]
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  // Show top entries + nearby entries for current user
  const getDisplayedEntries = () => {
    if (combinedLeaderboard.length <= maxEntries) {
      return combinedLeaderboard;
    }

    const topEntries = combinedLeaderboard.slice(0, 5);
    const currentUserEntry = combinedLeaderboard.find(e => e.isCurrentUser);
    
    if (!currentUserEntry || currentUserEntry.rank <= 5) {
      return combinedLeaderboard.slice(0, maxEntries);
    }

    // Show top 5 + current user + 2 nearby
    const userIndex = combinedLeaderboard.findIndex(e => e.isCurrentUser);
    const nearbyStart = Math.max(5, userIndex - 1);
    const nearbyEnd = Math.min(combinedLeaderboard.length, userIndex + 2);
    
    return [
      ...topEntries,
      ...combinedLeaderboard.slice(nearbyStart, nearbyEnd)
    ];
  };

  const displayedEntries = getDisplayedEntries();
  const totalParticipants = combinedLeaderboard.length;

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
            <div className="flex items-center gap-2">
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
              
              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors text-zinc-500"
                  title="Tutup Leaderboard"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
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
      {combinedLeaderboard.length > maxEntries && displayedEntries.length < combinedLeaderboard.length && (
        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            +{combinedLeaderboard.length - displayedEntries.length} peserta lainnya
          </p>
        </div>
      )}

    </Card>
  );
}
