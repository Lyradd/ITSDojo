"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { COURSES } from "@/lib/dummydata";
import { formatLocalDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Flame,
  Zap,
  Trophy,
  BookOpen,
  Medal,
  Calendar,
  Settings,
  Share2,
  User,
  Users,
  CheckCircle2,
  Lock,
  Moon,
  Sunrise,
  ShieldCheck,
  Bug,
  X
} from "lucide-react";

export default function ProfilePage() {
  const { 
     name, xp, streak, completedLessonIds = [], unlockedAchievements = [],
     nocturnalCount = 0, earlyBirdCount = 0, longestStreak = 0, mostXpInDay = 0, totalPerfectLessons = 0
  } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Dynamic Achievement Logic ---
  const getStreakTarget = (currentStreak: number) => {
    const targets = [3, 5, 10, 15, 30, 50, 100, 150, 200, 365];
    let level = 0;
    for (const t of targets) {
      if (currentStreak >= t) level++;
      else break;
    }
    const nextTarget = targets[Math.min(level, targets.length - 1)];
    return { level, target: nextTarget, maxLevel: targets.length };
  };

  const getXpTarget = (currentXp: number) => {
    const targets = [1000, 3000, 5000, 10000, 20000, 50000, 100000, 250000, 500000, 1000000];
    let level = 0;
    for (const t of targets) {
      if (currentXp >= t) level++;
      else break;
    }
    const nextTarget = targets[Math.min(level, targets.length - 1)];
    return { level, target: nextTarget, maxLevel: targets.length };
  };

  const getLessonTarget = (completedCount: number) => {
    const targets = [5, 10, 25, 50, 100];
    let level = 0;
    for (const t of targets) {
      if (completedCount >= t) level++;
      else break;
    }
    const nextTarget = targets[Math.min(level, targets.length - 1)];
    return { level, target: nextTarget, maxLevel: targets.length };
  };

  const getNocturnalTarget = (count: number) => {
    const targets = [1, 5, 10, 25, 50];
    let level = 0;
    for (const t of targets) {
      if (count >= t) level++;
      else break;
    }
    const nextTarget = targets[Math.min(level, targets.length - 1)];
    return { level, target: nextTarget, maxLevel: targets.length };
  };

  const getEarlyBirdTarget = (count: number) => {
    const targets = [1, 5, 10, 25, 50];
    let level = 0;
    for (const t of targets) {
      if (count >= t) level++;
      else break;
    }
    const nextTarget = targets[Math.min(level, targets.length - 1)];
    return { level, target: nextTarget, maxLevel: targets.length };
  };

  const wildfireData = getStreakTarget(streak);
  const sageData = getXpTarget(xp);
  const scholarData = getLessonTarget(completedLessonIds.length);
  const nocturnalData = getNocturnalTarget(nocturnalCount);
  const earlyBirdData = getEarlyBirdTarget(earlyBirdCount);

  // --- MOCK DATA (Data Dummy untuk Profil) ---
  const username = name.toLowerCase().replace(/\s/g, "");
  const joinDate = "Desember 2023";
  
  // Data Pencapaian (Achievements)
  const achievements = [
    // --- Normal Achievements ---
    { 
      id: "wildfire", 
      title: "Wildfire", 
      desc: `Mencapai ${wildfireData.target} hari streak berturut-turut`, 
      level: Math.max(1, wildfireData.level), 
      maxLevel: wildfireData.maxLevel, 
      progress: streak, 
      target: wildfireData.target,
      icon: Flame, 
      color: "text-orange-500 bg-orange-100 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
      unlocked: wildfireData.level > 0
    },
    { 
      id: "sage", 
      title: "Sage", 
      desc: `Mendapatkan total ${sageData.target.toLocaleString('id-ID')} XP`, 
      level: Math.max(1, sageData.level), 
      maxLevel: sageData.maxLevel, 
      progress: xp, 
      target: sageData.target, 
      icon: Zap, 
      color: "text-blue-500 bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
      unlocked: sageData.level > 0
    },
    { 
      id: "scholar", 
      title: "Scholar", 
      desc: `Menyelesaikan ${scholarData.target} Unit pelajaran`, 
      level: Math.max(1, scholarData.level), 
      maxLevel: scholarData.maxLevel, 
      progress: completedLessonIds.length, 
      target: scholarData.target, 
      icon: BookOpen, 
      color: "text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      unlocked: scholarData.level > 0
    },
    { 
      id: "winner", 
      title: "Winner", 
      desc: "Juara #1 di Leaderboard Mingguan", 
      level: 1, 
      maxLevel: 1, 
      progress: 0, 
      target: 1, 
      icon: Trophy, 
      color: "text-yellow-500 bg-yellow-100 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
      unlocked: false
    },
    // --- Secret Badges ---
    { 
      id: "nocturnal", 
      title: "Nocturnal", 
      desc: `Menyelesaikan ${nocturnalData.target} soal di keheningan malam (00:00 - 04:59)`, 
      level: Math.max(1, nocturnalData.level), 
      maxLevel: nocturnalData.maxLevel, 
      progress: nocturnalCount, 
      target: nocturnalData.target,
      icon: Moon, 
      color: "text-indigo-400 bg-indigo-950 border-indigo-800",
      unlocked: nocturnalData.level > 0
    },
    { 
      id: "early-bird", 
      title: "Early Bird", 
      desc: `Mengerjakan ${earlyBirdData.target} materi saat pagi hari (06:00 - 09:00)`, 
      level: Math.max(1, earlyBirdData.level), 
      maxLevel: earlyBirdData.maxLevel, 
      progress: earlyBirdCount, 
      target: earlyBirdData.target, 
      icon: Sunrise, 
      color: "text-amber-500 bg-amber-100 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
      unlocked: earlyBirdData.level > 0
    },
    { 
      id: "flawless", 
      title: "Flawless Victory", 
      desc: "Menyelesaikan sebuah unit materi tanpa pernah salah men-submit kode.", 
      level: 1, 
      maxLevel: 1, 
      progress: unlockedAchievements.includes('flawless') ? 1 : 0, 
      target: 1, 
      icon: ShieldCheck, 
      color: "text-emerald-500 bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      unlocked: unlockedAchievements.includes('flawless')
    },
    { 
      id: "bug-squasher", 
      title: "Bug Squasher", 
      desc: "Berhasil memperbaiki kode rusak yang diberikan pada challenge khusus.", 
      level: 1, 
      maxLevel: 1, 
      progress: unlockedAchievements.includes('bug-squasher') ? 1 : 0, 
      target: 1, 
      icon: Bug, 
      color: "text-rose-500 bg-rose-100 border-rose-200 dark:bg-rose-950 dark:border-rose-800",
      unlocked: unlockedAchievements.includes('bug-squasher')
    },
  ];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        
        {/* === KOLOM KIRI: INFO UTAMA === */}
        <div className="flex flex-col gap-8">
          
          {/* 1. Header Profil */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-8 border-b">
            {/* Avatar Besar */}
            <div className="w-32 h-32 rounded-full bg-blue-600 border-4 border-blue-100 dark:border-blue-900 flex items-center justify-center text-5xl font-bold text-white shadow-xl">
              {name.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <div>
                <h1 className="text-3xl font-extrabold text-zinc-800 dark:text-white">{name}</h1>
                <p className="text-zinc-400 font-medium">@{username}</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-zinc-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Bergabung {joinDate}
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" /> 120 Mengikuti
                </div>
                <div className="flex items-center gap-1.5">
                   <Users className="w-4 h-4" /> 85 Pengikut
                </div>
              </div>
            </div>

            {/* Tombol Aksi (Edit/Share) */}
            <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-xl border-2 hover:bg-zinc-100 hover:border-zinc-300">
                    <Share2 className="w-5 h-5 text-zinc-400" />
                </Button>
                <Link href="/settings">
                    <Button variant="outline" size="icon" className="rounded-xl border-2 hover:bg-zinc-100 hover:border-zinc-300">
                        <Settings className="w-5 h-5 text-zinc-400" />
                    </Button>
                </Link>
            </div>
          </div>

          {/* 2. Statistik */}
          <div>
            <h2 className="text-xl font-bold mb-4 text-zinc-700 dark:text-zinc-200">Statistik</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Flame} value={streak} label="Current Streak" color="text-orange-500" />
              <StatCard icon={Zap} value={xp.toLocaleString('id-ID')} label="Total XP" color="text-blue-500" />
              <StatCard icon={Medal} value="Silver" label="League" color="text-yellow-500" />
              <StatCard icon={Trophy} value="0" label="Top 3 Finishes" color="text-purple-500" />
            </div>
          </div>

          {/* 3. Jejak Aktivitas (Heatmap) */}
          <div>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">Aktivitas Belajar</h2>
                <span className="text-xs font-bold text-zinc-500">105 hari terakhir</span>
             </div>
             <Card className="p-6 pt-10 border-2 overflow-x-auto">
               <ActivityHeatmap />
             </Card>
          </div>

          {/* 4. Pencapaian (Achievements) */}
          <div>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">Pencapaian</h2>
                <Button onClick={() => setIsModalOpen(true)} variant="ghost" className="text-blue-500 font-bold uppercase text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20">Lihat Semua</Button>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {achievements.slice(0, 4).map((ach) => (
                    <div key={ach.id} className={`flex items-start gap-4 p-4 border-2 rounded-2xl bg-card ${ach.unlocked ? 'border-zinc-200' : 'border-zinc-100 opacity-80'}`}>
                        {/* Icon Badge */}
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border-b-4 ${ach.unlocked ? ach.color : 'bg-zinc-100 text-zinc-300 border-zinc-200'}`}>
                            {ach.unlocked ? <ach.icon className="w-8 h-8" fill="currentColor" /> : <Lock className="w-8 h-8" />}
                        </div>
                        
                        <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-bold text-lg">{ach.title}</h3>
                                <span className="text-xs font-bold text-zinc-400">Level {ach.level}/{ach.maxLevel}</span>
                            </div>
                            <p className="text-sm text-zinc-500 mb-3">{ach.desc}</p>
                            
                            {/* Progress Bar Achievement */}
                            {ach.target && (
                                <div className="h-3 w-full bg-zinc-100 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${ach.unlocked ? 'bg-yellow-400' : 'bg-zinc-300'}`}
                                        style={{ width: `${Math.min((ach.progress / ach.target) * 100, 100)}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* === KOLOM KANAN: SIDEBAR WIDGETS === */}
        <div className="flex flex-col gap-6">
            
            {/* Kursus Saya */}
            <Card className="p-4 rounded-2xl border-2">
                <h3 className="font-bold text-lg mb-4 text-zinc-700 dark:text-zinc-200">Kursus Saya</h3>
                <div className="space-y-4">
                    {COURSES.slice(0, 3).map((course, idx) => ( 
                        <div key={course.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800 ${course.color}`}>
                                <img 
                                  src={course.image} 
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h4 className="font-bold text-sm truncate">{course.title}</h4>
                                <div className="text-xs text-zinc-500 font-bold flex items-center gap-1">
                                   <span className={idx === 0 ? "text-green-500" : "text-zinc-400"}>
                                     {idx === 0 ? "Sedang dipelajari" : "Belum dimulai"}
                                   </span>
                                </div>
                            </div>
                            {idx === 0 && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>
                    ))}
                </div>
                 <Link href="/courses">
                    <Button variant="ghost" className="w-full mt-2 text-blue-500 font-bold uppercase text-xs hover:bg-blue-50">
                        Lihat Semua
                    </Button>
                </Link>
            </Card>

            {/* Teman (Mock) */}
            <Card className="p-4 rounded-2xl border-2">
                <h3 className="font-bold text-lg mb-4 text-zinc-700 dark:text-zinc-200">Teman Belajar</h3>
                 <div className="space-y-4">
                    {["Sarah K.", "Budi S.", "Citra A."].map((friend: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 border-2 border-zinc-200">
                                {friend.charAt(0)}
                             </div>
                             <div className="flex-1">
                                <h4 className="font-bold text-sm">{friend}</h4>
                                <div className="text-xs text-zinc-400">1.2k XP • Lv. 5</div>
                             </div>
                             <Button size="sm" variant="outline" className="h-8 text-xs font-bold text-blue-500 border-blue-200 hover:bg-blue-50">
                                Follow
                             </Button>
                        </div>
                    ))}
                 </div>
                 <Button variant="ghost" className="w-full mt-4 text-blue-500 font-bold uppercase text-xs hover:bg-blue-50">
                    Cari Teman
                </Button>
            </Card>

        </div>
      </div>

      {/* --- ALL ACHIEVEMENTS MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in-0 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  Trophy Room & Badges
                </h2>
                <p className="text-sm text-zinc-500 mt-1">Koleksi seluruh pencapaian dan lencana rahasia Anda.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              
              {/* --- Personal Records Section --- */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-blue-500" /> Rekor Pribadi
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border-2 rounded-xl flex items-center gap-4 bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-xl"><Flame className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Longest Streak</p>
                      <p className="text-xl font-black">{Math.max(longestStreak, streak)} <span className="text-sm text-zinc-500 font-bold">Hari</span></p>
                    </div>
                  </div>
                  <div className="p-4 border-2 rounded-xl flex items-center gap-4 bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-xl"><Zap className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Most XP / Day</p>
                      <p className="text-xl font-black">{mostXpInDay.toLocaleString('id-ID')} <span className="text-sm text-zinc-500 font-bold">XP</span></p>
                    </div>
                  </div>
                  <div className="p-4 border-2 rounded-xl flex items-center gap-4 bg-white dark:bg-zinc-950 shadow-sm">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-xl"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Perfect Lessons</p>
                      <p className="text-xl font-black">{totalPerfectLessons} <span className="text-sm text-zinc-500 font-bold">Unit</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Achievements List --- */}
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" /> Daftar Pencapaian
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {achievements.map((ach: any) => (
                    <div key={ach.id} className={`flex flex-col gap-3 p-5 border-2 rounded-2xl bg-card ${ach.unlocked ? 'border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow' : 'border-zinc-100 dark:border-zinc-800 opacity-70 bg-zinc-50/50 dark:bg-zinc-900/50'}`}>
                        <div className="flex items-start gap-4">
                            {/* Icon Badge */}
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-b-4 ${ach.unlocked ? ach.color : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 border-zinc-300 dark:border-zinc-700'}`}>
                                {ach.unlocked ? <ach.icon className="w-7 h-7" fill="currentColor" /> : <Lock className="w-7 h-7" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-base truncate pr-2 leading-tight">{ach.title}</h3>
                                    {ach.target > 1 && <span className="text-[10px] font-bold text-zinc-400 shrink-0 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">Lvl {ach.level}</span>}
                                </div>
                                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{ach.desc}</p>
                            </div>
                        </div>
                        
                        {/* Progress Bar */}
                        {ach.target > 1 && (
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${ach.unlocked ? 'bg-yellow-400' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, (ach.progress / ach.target) * 100))}%` }}
                                />
                            </div>
                        )}
                    </div>
                 ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Komponen Kecil untuk Kotak Statistik
function StatCard({ icon: Icon, value, label, color }: any) {
  return (
    <div className="p-3 border-2 rounded-xl flex flex-col gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
      <Icon className={`w-6 h-6 ${color}`} />
      <div>
        <div className="font-bold text-xl">{value}</div>
        <div className="text-xs text-zinc-400 font-bold uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

// Komponen GitHub-Style Heatmap Dinamis
function ActivityHeatmap() {
  const { activityHistory } = useUserStore();

  const today = new Date();
  // Normalisasi waktu hari ini ke tengah malam agar komparasi tanggal akurat
  today.setHours(0, 0, 0, 0);
  
  const todayDayOfWeek = today.getDay(); // 0 = Minggu, 1 = Senin ... 6 = Sabtu
  
  // Render 15 minggu (15 kolom * 7 hari)
  // Kolom terakhir berakhir di hari Sabtu minggu ini.
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - todayDayOfWeek - (14 * 7));
  
  const totalDays = 15 * 7; // 105 kotak
  
  // Buat array tanggal
  const calendarDays = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  // Kelompokkan menjadi 15 kolom (per minggu)
  const weeks = [];
  for (let i = 0; i < 15; i++) {
    weeks.push(calendarDays.slice(i * 7, (i + 1) * 7));
  }

  // Generate label bulan
  const monthLabels: { month: string; colIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    const month = week[0].getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        month: week[0].toLocaleDateString('id-ID', { month: 'short' }),
        colIndex: index
      });
      lastMonth = month;
    }
  });

  return (
    <div className="flex flex-col gap-2 w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
      
      {/* Container Kalender */}
      <div className="flex min-w-max">
        
        {/* Label Hari di Kiri */}
        <div className="flex flex-col gap-1.5 mt-6 mr-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-bold text-right">
          <div className="h-3.5 md:h-4"></div> {/* Minggu */}
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Sen</div>
          <div className="h-3.5 md:h-4"></div> {/* Selasa */}
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Rab</div>
          <div className="h-3.5 md:h-4"></div> {/* Kamis */}
          <div className="h-3.5 md:h-4 flex items-center justify-end leading-none">Jum</div>
          <div className="h-3.5 md:h-4"></div> {/* Sabtu */}
        </div>

        <div className="flex flex-col">
          {/* Label Bulan di Atas */}
          <div className="relative h-6 w-full text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">
            {monthLabels.map((lbl, i) => (
              <span 
                key={i} 
                className="absolute top-0 leading-none"
                style={{ left: `calc(${lbl.colIndex} * (1rem + 0.375rem))` }} // 1rem width + 0.375rem gap (1.5 * 0.25rem)
              >
                {lbl.month}
              </span>
            ))}
          </div>

          {/* Grid Kotak */}
          <div className="flex gap-1.5">
            {weeks.map((week: Date[], weekIdx: number) => (
              <div key={weekIdx} className="flex flex-col gap-1.5">
                {week.map((dayObj: Date, dayIdx: number) => {
                  const dateStr = formatLocalDate(dayObj);
                  const record = activityHistory.find((h: { date: string, count: number }) => h.date === dateStr);
                  const count = record ? record.count : 0;
                  const isFuture = dayObj > today;
                  
                  // Konversi count ke warna
                  let level = 0;
                  if (count === 1) level = 1;
                  else if (count === 2) level = 2;
                  else if (count === 3) level = 3;
                  else if (count >= 4) level = 4;

                  let colorClass = "bg-zinc-100 dark:bg-zinc-800/50";
                  if (isFuture) colorClass = "bg-transparent"; // Kosongkan hari di masa depan
                  else if (level === 1) colorClass = "bg-blue-200 dark:bg-blue-900/60";
                  else if (level === 2) colorClass = "bg-blue-300 dark:bg-blue-700/80";
                  else if (level === 3) colorClass = "bg-blue-400 dark:bg-blue-500/90";
                  else if (level === 4) colorClass = "bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
                  
                  return (
                    <div 
                      key={dayIdx} 
                      className={`relative group w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] ${colorClass} ${!isFuture && 'hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-200 transition-all cursor-pointer'}`} 
                    >
                      {/* Tooltip (Hanya Muncul Jika Bukan Masa Depan) */}
                      {!isFuture && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl pointer-events-none flex flex-col items-center border border-zinc-700 dark:border-zinc-300">
                          <span>{count === 0 ? "Tidak ada aktivitas" : `${count} kontribusi`}</span>
                          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {dayObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-zinc-800 dark:border-t-zinc-200"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 min-w-max">
         <span>Sedikit</span>
         <div className="flex gap-1.5">
            <div className="w-3.5 h-3.5 rounded-[3px] bg-zinc-100 dark:bg-zinc-800/50"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-200 dark:bg-blue-900/60"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-300 dark:bg-blue-700/80"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-400 dark:bg-blue-500/90"></div>
            <div className="w-3.5 h-3.5 rounded-[3px] bg-blue-500 dark:bg-blue-400"></div>
         </div>
         <span>Banyak</span>
      </div>
    </div>
  );
}