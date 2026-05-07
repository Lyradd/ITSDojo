"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/lib/store';
import { INITIAL_LEADERBOARD } from '@/lib/evaluation-data';
import { LeaderboardEntry } from '@/lib/evaluation-store';
import { wsClient } from '@/lib/websocket-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeaderboardEntryComponent } from '@/components/leaderboard/leaderboard-entry';
import { ProfileRadarModal } from '@/components/leaderboard/profile-radar-modal';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Zap,
  Medal,
  Crown,
  Filter,
  Calendar,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const { isLoggedIn, name, xp, level } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [scopeFilter, setScopeFilter] = useState<'angkatan' | 'course' | 'evaluation'>('angkatan');
  const [subScope, setSubScope] = useState<string>('2023');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<LeaderboardEntry | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router, isMounted]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    // Connect to WebSocket
    wsClient.connect();

    // Subscribe to connection status
    const unsubscribeStatus = wsClient.onConnectionStatus((connected) => {
      setIsConnected(connected);
    });

    // Subscribe to leaderboard updates
    const unsubscribeLeaderboard = wsClient.onLeaderboardUpdate((data) => {
      // If data is empty, keep using our current leaderboard (which has mock data)
      if (!data || data.length === 0) return;

      // Filter out current user from received data to prevent duplicates
      const otherUsers = data.filter(entry => entry.userId !== 'current-user');
      
      // Also filter out any INITIAL_LEADERBOARD users that are in the live data
      const liveUserIds = new Set(otherUsers.map(u => u.userId));
      const filteredMockData = INITIAL_LEADERBOARD.filter(u => !liveUserIds.has(u.userId) && u.userId !== 'current-user');

      // Add current user with fresh data
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
        batch: '2023',
        coursesTaken: 4,
      };

      const allEntries = [...otherUsers, ...filteredMockData, currentUserEntry];
      const sorted = allEntries.sort((a, b) => b.score - a.score);
      const ranked = sorted.map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

      setLeaderboard(ranked);
    });

    // Add current user to server leaderboard
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
      batch: '2023',
      coursesTaken: 4,
    };
    
    // Wait a bit for connection then add user
    const timeout = setTimeout(() => {
      wsClient.addUser(currentUserEntry);
    }, 500);

    // Cleanup
    return () => {
      clearTimeout(timeout);
      unsubscribeStatus();
      unsubscribeLeaderboard();
    };
  }, [isMounted, isLoggedIn, name, xp]);

  // Simulate filtering the leaderboard based on the chosen scope
  const filteredLeaderboard = useMemo(() => {
    // Create a deterministic pseudo-random filter based on the subScope string length
    // This is just to mock the UI behavior
    const seed = subScope.length;
    let filtered = leaderboard;
    
    if (scopeFilter === 'angkatan') {
        filtered = leaderboard.filter(e => e.batch === subScope || e.isCurrentUser);
    } else {
        // For course and evaluation, we show everyone but simulate that they are filtered by context
        // This ensures the leaderboard doesn't look empty and Batch info is still there
        filtered = leaderboard;
    }
    
    // Re-rank
    return filtered.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));
  }, [leaderboard, scopeFilter, subScope]);

  if (!isMounted || !isLoggedIn) return null;

  const currentUserEntry = filteredLeaderboard.find(e => e.isCurrentUser) || leaderboard.find(e => e.isCurrentUser);
  const topThree = filteredLeaderboard.slice(0, 3);
  const totalParticipants = filteredLeaderboard.length;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-2xl border-2 border-yellow-500/20 shadow-xl shadow-yellow-500/5">
              <Trophy className="w-8 h-8 text-yellow-600" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
                Leaderboard
              </h1>
              <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-sm">
                <span>ITSDojo Community</span>
                {isConnected && (
                   <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                     Live Update
                   </span>
                )}
              </div>
            </div>
          </div>
          
          <Link href="/learn">
            <Button className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-6 shadow-lg shadow-blue-600/20">
              Mulai Belajar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <Card className="p-6 rounded-3xl border-2 bg-linear-to-br from-yellow-500 to-orange-600 border-none shadow-xl shadow-orange-500/20 group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-white/80">
            <Crown className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Peringkat Kamu</span>
          </div>
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-4xl font-black tracking-tighter">#{currentUserEntry?.rank || '-'}</span>
            <span className="text-sm font-bold opacity-80">/ {totalParticipants}</span>
          </div>
          <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
             <div className="h-full bg-white w-2/3" />
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-blue-500/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-zinc-400">
            <Zap className="w-5 h-5 text-blue-600" fill="currentColor" />
            <span className="text-xs font-black uppercase tracking-widest">Total XP</span>
          </div>
          <div className="text-4xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
            {xp.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 font-black mt-2 uppercase tracking-widest">
            Level {level} Master
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-green-500/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-zinc-400">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs font-black uppercase tracking-widest">Akurasi Rata-rata</span>
          </div>
          <div className="text-4xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
            {currentUserEntry?.accuracy || 0}%
          </div>
          <div className="text-xs text-green-600 font-black mt-2 uppercase tracking-widest">
            Top 10% Batch
          </div>
        </Card>

        <Card className="p-6 rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-purple-500/50 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-zinc-400">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-black uppercase tracking-widest">Peserta Aktif</span>
          </div>
          <div className="text-4xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
            {totalParticipants}
          </div>
          <div className="text-xs text-purple-600 font-black mt-2 uppercase tracking-widest">
            Mahasiswa Terdaftar
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        {/* Left: Full Leaderboard */}
        <div className="space-y-6">
          {/* Top 3 Podium */}
          <Card className="p-6 rounded-2xl border-2 bg-linear-to-br from-yellow-50 via-white to-purple-50 dark:from-yellow-950/20 dark:via-zinc-900 dark:to-purple-950/20">
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <Medal className="w-6 h-6 text-yellow-600" />
              Top 3 Performers
            </h3>
            
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-white shadow-lg">
                    {topThree[1].name.charAt(0)}
                  </div>
                  <div className="text-4xl font-bold mb-1">🥈</div>
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 text-center truncate w-full">
                    {topThree[1].name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{topThree[1].score} XP</div>
                  <div className="h-24 w-full bg-linear-to-t from-gray-400 to-gray-300 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">#2</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-3xl mb-2 border-4 border-white shadow-xl ring-4 ring-yellow-200">
                    {topThree[0].name.charAt(0)}
                  </div>
                  <div className="text-5xl font-bold mb-1">🥇</div>
                  <div className="font-bold text-base text-zinc-800 dark:text-zinc-200 text-center truncate w-full">
                    {topThree[0].name}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">{topThree[0].score} XP</div>
                  <div className="h-32 w-full bg-linear-to-t from-yellow-500 to-yellow-400 rounded-t-xl mt-2 flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-3xl">#1</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-linear-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-white shadow-lg">
                    {topThree[2].name.charAt(0)}
                  </div>
                  <div className="text-4xl font-bold mb-1">🥉</div>
                  <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200 text-center truncate w-full">
                    {topThree[2].name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{topThree[2].score} XP</div>
                  <div className="h-20 w-full bg-linear-to-t from-amber-700 to-amber-600 rounded-t-xl mt-2 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">#3</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Full Rankings */}
          <Card className="p-0 rounded-3xl border-2 bg-white dark:bg-zinc-900 overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
              {/* Scope Filter Header */}
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                      <h3 className="text-2xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
                        Peringkat Mahasiswa
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      {(['angkatan', 'course', 'evaluation'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => {
                              setScopeFilter(filter);
                              // Reset subscope to a default valid value for the new filter
                              if (filter === 'angkatan') setSubScope('2023');
                              else if (filter === 'course') setSubScope('web');
                              else setSubScope('quiz1');
                          }}
                          className={cn(
                            "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all duration-200",
                            scopeFilter === filter 
                              ? "bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          )}
                        >
                          {filter === 'angkatan' && 'Angkatan'}
                          {filter === 'course' && 'Mata Kuliah'}
                          {filter === 'evaluation' && 'Evaluasi'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sub Scope Selection Selection */}
                  <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex-1 h-[1px] bg-zinc-200 dark:bg-zinc-800" />
                    <div className="relative">
                      <select 
                        className="appearance-none pl-4 pr-10 py-2 text-xs font-black uppercase tracking-widest border-2 border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 outline-none focus:border-blue-500 transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        value={subScope}
                        onChange={(e) => setSubScope(e.target.value)}
                      >
                        {scopeFilter === 'angkatan' && (
                          <>
                            <option value="2023">Batch 2023 (Active)</option>
                            <option value="2022">Batch 2022</option>
                            <option value="2021">Batch 2021</option>
                          </>
                        )}
                        {scopeFilter === 'course' && (
                          <>
                            <option value="web">Pemrograman Web</option>
                            <option value="pbo">Pemrograman Berorientasi Objek</option>
                            <option value="sbd">Sistem Basis Data</option>
                          </>
                        )}
                        {scopeFilter === 'evaluation' && (
                          <>
                            <option value="quiz1">Kuis 1: HTML & CSS</option>
                            <option value="quiz2">Kuis 2: React Native</option>
                            <option value="quiz3">Evaluasi Tengah Semester</option>
                          </>
                        )}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Filter className="w-3 h-3 text-zinc-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div className="p-4 space-y-2 max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {filteredLeaderboard.map((entry, index) => (
                <LeaderboardEntryComponent 
                  key={entry.userId} 
                  entry={entry} 
                  index={index}
                  onProfileClick={setSelectedProfile}
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

      {/* Profile Radar Modal Overlay */}
      <ProfileRadarModal 
        profile={selectedProfile} 
        onClose={() => setSelectedProfile(null)} 
      />
    </div>
  );
}
