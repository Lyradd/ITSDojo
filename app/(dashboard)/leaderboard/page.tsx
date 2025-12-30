"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { INITIAL_LEADERBOARD } from '@/lib/evaluation-data';
import { LeaderboardEntry } from '@/lib/evaluation-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeaderboardEntryComponent } from '@/components/leaderboard/leaderboard-entry';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Zap,
  Medal,
  Crown,
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const { isLoggedIn, name, xp, level } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router, isMounted]);

  // Initialize leaderboard with current user
  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    // Add current user to leaderboard
    const currentUserEntry: LeaderboardEntry = {
      userId: 'current-user',
      name: `${name} (You)`,
      avatar: 'bg-blue-200 text-blue-700',
      score: xp,
      totalQuestions: 50,
      answeredQuestions: 35,
      accuracy: 85,
      rank: 0,
      lastUpdate: Date.now(),
      isCurrentUser: true,
    };

    const allEntries = [...INITIAL_LEADERBOARD, currentUserEntry];
    const sorted = allEntries.sort((a, b) => b.score - a.score);
    const ranked = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    setLeaderboard(ranked);
  }, [isMounted, isLoggedIn, name, xp]);

  if (!isMounted || !isLoggedIn) return null;

  const currentUserEntry = leaderboard.find(e => e.isCurrentUser);
  const topThree = leaderboard.slice(0, 3);
  const totalParticipants = leaderboard.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-600" fill="currentColor" />
          <h1 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            Leaderboard
          </h1>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          Lihat ranking dan kompetisi dengan sesama mahasiswa
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 rounded-2xl border-2 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-6 h-6 text-yellow-600" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Peringkat Kamu</span>
          </div>
          <div className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">
            #{currentUserEntry?.rank || '-'}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
            dari {totalParticipants} peserta
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-blue-600" fill="currentColor" />
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Total XP</span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {xp}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Level {level}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Akurasi</span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {currentUserEntry?.accuracy || 0}%
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            rata-rata
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border-2">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Peserta Aktif</span>
          </div>
          <div className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">
            {totalParticipants}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            mahasiswa
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Left: Full Leaderboard */}
        <div className="space-y-6">
          {/* Top 3 Podium */}
          <Card className="p-6 rounded-2xl border-2 bg-gradient-to-br from-yellow-50 via-white to-purple-50 dark:from-yellow-950/20 dark:via-zinc-900 dark:to-purple-950/20">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <Medal className="w-6 h-6 text-yellow-600" />
              Top 3 Performers
            </h3>
            
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-white shadow-lg">
                    {topThree[1].name.charAt(0)}
                  </div>
                  <div className="text-4xl font-bold mb-1">🥈</div>
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 text-center truncate w-full">
                    {topThree[1].name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{topThree[1].score} XP</div>
                  <div className="h-24 w-full bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">#2</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-3xl mb-2 border-4 border-white shadow-xl ring-4 ring-yellow-200">
                    {topThree[0].name.charAt(0)}
                  </div>
                  <div className="text-5xl font-bold mb-1">🥇</div>
                  <div className="font-bold text-base text-zinc-800 dark:text-zinc-200 text-center truncate w-full">
                    {topThree[0].name}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{topThree[0].score} XP</div>
                  <div className="h-32 w-full bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-xl mt-2 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-3xl">#1</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-white shadow-lg">
                    {topThree[2].name.charAt(0)}
                  </div>
                  <div className="text-4xl font-bold mb-1">🥉</div>
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 text-center truncate w-full">
                    {topThree[2].name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{topThree[2].score} XP</div>
                  <div className="h-20 w-full bg-gradient-to-t from-amber-700 to-amber-600 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">#3</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Full Rankings */}
          <Card className="p-6 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                Semua Peringkat
              </h3>
              
              {/* Time Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-500" />
                <div className="flex gap-1">
                  {(['all', 'week', 'month'] as const).map((filter) => (
                    <Button
                      key={filter}
                      size="sm"
                      variant={timeFilter === filter ? 'default' : 'outline'}
                      onClick={() => setTimeFilter(filter)}
                      className={cn(
                        "text-xs font-bold",
                        timeFilter === filter && "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {filter === 'all' && 'Semua'}
                      {filter === 'week' && 'Minggu Ini'}
                      {filter === 'month' && 'Bulan Ini'}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {leaderboard.map((entry, index) => (
                <LeaderboardEntryComponent 
                  key={entry.userId} 
                  entry={entry} 
                  index={index}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right: User Stats & Info */}
        <div className="space-y-6">
          {/* Your Progress */}
          <Card className="p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
              Progress Kamu
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Soal Dijawab</span>
                  <span className="font-bold text-blue-900 dark:text-blue-100">
                    {currentUserEntry?.answeredQuestions || 0}/{currentUserEntry?.totalQuestions || 0}
                  </span>
                </div>
                <div className="h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ 
                      width: `${((currentUserEntry?.answeredQuestions || 0) / (currentUserEntry?.totalQuestions || 1)) * 100}%` 
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-700 dark:text-blue-300 mb-2">Statistik</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Akurasi</span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">
                      {currentUserEntry?.accuracy || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Total XP</span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">{xp}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 dark:text-blue-400">Level</span>
                    <span className="font-bold text-blue-900 dark:text-blue-100">{level}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6 rounded-2xl border-2">
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                onClick={() => router.push('/evaluation')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Ikut Evaluasi
              </Button>
              
              <Button 
                variant="outline"
                className="w-full font-bold"
                onClick={() => router.push('/learn')}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Tingkatkan Skill
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
