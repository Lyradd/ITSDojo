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
import { 
  Trophy, 
  Zap,
  Target,
  Users,
  Medal,
  List,
  ClipboardCheck,
  TrendingUp,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const router = useRouter();
  const { isLoggedIn, name, xp, level } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [scopeFilter, setScopeFilter] = useState<'angkatan' | 'course'>('angkatan');
  const [subScope, setSubScope] = useState<string>('2023');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push('/login');
    }
  }, [isLoggedIn, router, isMounted]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isMounted || !isLoggedIn) return;

    wsClient.connect();
    const unsubscribeStatus = wsClient.onConnectionStatus((connected) => {
      setIsConnected(connected);
    });

    const unsubscribeLeaderboard = wsClient.onLeaderboardUpdate((data) => {
      if (!data || data.length === 0) return;

      const otherUsers = data.filter(entry => entry.userId !== 'current-user');
      const liveUserIds = new Set(otherUsers.map(u => u.userId));
      const filteredMockData = INITIAL_LEADERBOARD.filter(u => !liveUserIds.has(u.userId) && u.userId !== 'current-user');

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
    
    const timeout = setTimeout(() => {
      wsClient.addUser(currentUserEntry);
    }, 500);

    return () => {
      clearTimeout(timeout);
      unsubscribeStatus();
      unsubscribeLeaderboard();
    };
  }, [isMounted, isLoggedIn, name, xp]);

  // Simulate filtering the leaderboard based on the chosen scope
  const filteredLeaderboard = useMemo(() => {
    let filtered = leaderboard;
    
    if (scopeFilter === 'angkatan') {
        filtered = leaderboard.filter(e => e.batch === subScope || e.isCurrentUser);
    } else {
        filtered = leaderboard;
    }
    
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
                Papan Peringkat
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
            <Button className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-6 shadow-lg shadow-blue-600/20 h-12">
              Mulai Belajar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        
        {/* MAIN COLUMN */}
        <div className="min-w-0">
          
          {/* Header Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-5 rounded-3xl border-none bg-linear-to-br from-yellow-500 to-orange-600 shadow-xl shadow-orange-500/20 group hover:-translate-y-1 transition-all duration-300">
              <div className="text-[11px] font-black uppercase tracking-widest text-white/80 mb-2 flex items-center gap-2">
                <Crown className="w-4 h-4" /> Peringkat Kamu
              </div>
              <div className="text-4xl font-black tracking-tighter text-white">
                #{currentUserEntry?.rank || '-'}
                <span className="text-lg font-bold opacity-80">/{totalParticipants}</span>
              </div>
              <div className="mt-4 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full bg-white w-2/3" />
              </div>
            </Card>

            <Card className="p-5 rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300">
              <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" fill="currentColor" /> Total XP
              </div>
              <div className="text-3xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
                {xp}
              </div>
              <div className="text-[10px] text-blue-600 font-black mt-2 uppercase tracking-widest">
                Level {level} Master
              </div>
            </Card>

            <Card className="p-5 rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-green-500/50 hover:-translate-y-1 transition-all duration-300">
              <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" /> Akurasi
              </div>
              <div className="text-3xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
                {currentUserEntry?.accuracy || 0}%
              </div>
              <div className="text-[10px] text-green-600 font-black mt-2 uppercase tracking-widest">
                Top 10% angkatan
              </div>
            </Card>

            <Card className="p-5 rounded-3xl border-2 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300">
              <div className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" /> Aktif
              </div>
              <div className="text-3xl font-black tracking-tighter text-zinc-800 dark:text-zinc-100">
                {totalParticipants}
              </div>
              <div className="text-[10px] text-purple-600 font-black mt-2 uppercase tracking-widest">
                Mahasiswa terdaftar
              </div>
            </Card>
          </div>

          {/* Filter Section */}
          <div className="mb-6">
            <div className="flex gap-2 mb-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              {(['angkatan', 'course'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                      setScopeFilter(filter);
                      if (filter === 'angkatan') setSubScope('2023');
                      else setSubScope('web');
                  }}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors",
                    scopeFilter === filter 
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  {filter === 'angkatan' && 'Angkatan'}
                  {filter === 'course' && 'Mata Kuliah'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Filter:</span>
              <select 
                className="flex-1 max-w-[240px] px-3 py-1.5 text-[13px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none hover:border-zinc-400 focus:border-blue-500 transition-colors"
                value={subScope}
                onChange={(e) => setSubScope(e.target.value)}
              >
                {scopeFilter === 'angkatan' && (
                  <>
                    <option value="2023">Angkatan 2023 (Aktif)</option>
                    <option value="2022">Angkatan 2022</option>
                    <option value="2021">Angkatan 2021</option>
                  </>
                )}
                {scopeFilter === 'course' && (
                  <>
                    <option value="web">Pemrograman Web</option>
                    <option value="pbo">Pemrograman Berorientasi Objek</option>
                    <option value="sbd">Sistem Basis Data</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Podium Section */}
          <div className="bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-[#1a1a1e] dark:to-[#212126] border border-zinc-200 dark:border-[#2e2e36] rounded-3xl p-8 mb-6 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/10">
            <div className="flex items-center gap-2 text-[14px] font-bold text-zinc-800 dark:text-[#e8e8ed] mb-8">
              <Medal className="w-5 h-5 text-[#faae1a]" /> 3 Peserta Terbaik
            </div>
            
            <div className="grid grid-cols-3 gap-3 items-end">
              {/* 2nd Place */}
              <div className="flex flex-col items-center order-1">
                {topThree[1] && (
                  <>
                    <div className="w-[72px] h-[72px] rounded-full bg-[#d3d1c7] text-[#444441] flex items-center justify-center text-[28px] font-bold mb-2 border-[3px] border-[#d3d1c7] shadow-[0_0_15px_rgba(211,209,199,0.3)]">
                      {topThree[1].name.charAt(0)}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#d3d1c7] text-[#444441] flex items-center justify-center text-[15px] font-bold mt-[-24px] mb-2 border-[3px] border-zinc-50 dark:border-[#1a1a1e]">
                      2
                    </div>
                    <div className="text-[14px] font-bold text-zinc-800 dark:text-[#e8e8ed] mb-0.5 truncate w-full text-center">{topThree[1].name}</div>
                    <div className="text-[12px] font-medium text-[#a0a0a8] mb-3">{topThree[1].score} XP</div>
                    <div className="w-full h-[80px] bg-linear-to-br from-[#d3d1c7] to-[#b4b2a9] rounded-xl flex items-center justify-center border border-[#d3d1c7] shadow-lg">
                      <span className="text-[32px] font-black text-[#444441]">#2</span>
                    </div>
                  </>
                )}
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center order-2">
                {topThree[0] && (
                  <>
                    <div className="w-[88px] h-[88px] rounded-full bg-[#faae1a] text-[#2c2402] flex items-center justify-center text-[36px] font-black mb-2 border-[4px] border-[#faae1a] shadow-[0_0_20px_rgba(250,174,26,0.4)]">
                      {topThree[0].name.charAt(0)}
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#faae1a] text-[#2c2402] flex items-center justify-center text-[18px] font-black mt-[-28px] mb-2 border-[3px] border-zinc-50 dark:border-[#1a1a1e]">
                      1
                    </div>
                    <div className="text-[15px] font-bold text-zinc-800 dark:text-[#e8e8ed] mb-0.5 truncate w-full text-center">{topThree[0].name}</div>
                    <div className="text-[13px] font-medium text-[#a0a0a8] mb-3">{topThree[0].score} XP</div>
                    <div className="w-full h-[105px] bg-linear-to-br from-[#faae1a] to-[#f89f1f] rounded-xl flex items-center justify-center border-2 border-[#faae1a] shadow-lg shadow-yellow-900/20">
                      <span className="text-[44px] font-black text-[#2c2402]">#1</span>
                    </div>
                  </>
                )}
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center order-3">
                {topThree[2] && (
                  <>
                    <div className="w-[72px] h-[72px] rounded-full bg-[#f0997b] text-[#4a1b0c] flex items-center justify-center text-[28px] font-bold mb-2 border-[3px] border-[#f0997b] shadow-[0_0_15px_rgba(240,153,123,0.3)]">
                      {topThree[2].name.charAt(0)}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#f0997b] text-[#4a1b0c] flex items-center justify-center text-[15px] font-bold mt-[-24px] mb-2 border-[3px] border-zinc-50 dark:border-[#1a1a1e]">
                      3
                    </div>
                    <div className="text-[14px] font-bold text-zinc-800 dark:text-[#e8e8ed] mb-0.5 truncate w-full text-center">{topThree[2].name}</div>
                    <div className="text-[12px] font-medium text-[#a0a0a8] mb-3">{topThree[2].score} XP</div>
                    <div className="w-full h-[64px] bg-linear-to-br from-[#f0997b] to-[#d85a30] rounded-xl flex items-center justify-center border border-[#f0997b] shadow-lg">
                      <span className="text-[32px] font-black text-[#4a1b0c]">#3</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* List Section */}
          <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none">
            <div className="px-6 py-4 bg-zinc-50/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
              <List className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Peringkat Mahasiswa
            </div>
            <div className="flex flex-col max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              {filteredLeaderboard.map((entry, index) => (
                <div key={entry.userId} className="px-3">
                  <LeaderboardEntryComponent 
                    entry={entry} 
                    index={index}
                  />
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* SIDEBAR COLUMN */}
        <div className="flex flex-col gap-6">
          
          {/* Progress Card */}
          <Card className="bg-white dark:bg-zinc-900 border-2 border-blue-200 dark:border-blue-800/50 rounded-3xl p-6 shadow-xl shadow-blue-100/50 dark:shadow-none hover:border-blue-400 dark:hover:border-blue-700 transition-colors">
            <h3 className="text-[16px] font-bold text-blue-900 dark:text-blue-100 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Progres Kamu
            </h3>
            
            <div className="mb-6">
              <div className="flex justify-between text-[13px] text-zinc-600 dark:text-zinc-400 mb-2 font-medium">
                <span>Soal Dijawab</span>
                <span className="font-bold text-blue-900 dark:text-blue-100">
                  {currentUserEntry?.answeredQuestions || 0}/{currentUserEntry?.totalQuestions || 0}
                </span>
              </div>
              <div className="w-full h-2 bg-blue-100 dark:bg-blue-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentUserEntry?.answeredQuestions || 0) / (currentUserEntry?.totalQuestions || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="border-t-2 border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Akurasi</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{currentUserEntry?.accuracy || 0}%</span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Total XP</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Zap className="w-3 h-3" fill="currentColor" /> {xp}
                </span>
              </div>
              <div className="flex justify-between items-center text-[14px]">
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Level</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">{level}</span>
              </div>
            </div>
          </Card>

          {/* Action Card */}
          <Card className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
            <h3 className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" fill="currentColor" /> Tindakan Cepat
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/evaluation')}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5"
              >
                <ClipboardCheck className="w-4 h-4" /> Ikut Evaluasi
              </button>
              <button 
                onClick={() => router.push('/learn')}
                className="w-full p-3 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:border-zinc-300 dark:hover:border-zinc-600"
              >
                <TrendingUp className="w-4 h-4" /> Tingkatkan Skill
              </button>
            </div>
          </Card>

        </div>

      </div>
    </div>
  );
}
