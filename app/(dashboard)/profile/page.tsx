"use client";

import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { COURSES } from "@/lib/dummydata";
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
  Lock
} from "lucide-react";

export default function ProfilePage() {
  const { name, xp } = useUserStore();

  // --- MOCK DATA (Data Dummy untuk Profil) ---
  const username = name.toLowerCase().replace(/\s/g, "");
  const joinDate = "Desember 2023";
  
  // Data Pencapaian (Achievements)
  const achievements = [
    { 
      id: 1, 
      title: "Wildfire", 
      desc: "Mencapai 3 hari streak berturut-turut", 
      level: 1, 
      maxLevel: 10, 
      progress: 3, 
      target: 3,
      icon: Flame, 
      color: "text-orange-500 bg-orange-100 border-orange-200",
      unlocked: true
    },
    { 
      id: 2, 
      title: "Sage", 
      desc: "Mendapatkan total 1.000 XP", 
      level: 4, 
      maxLevel: 10, 
      progress: xp, 
      target: 1000, 
      icon: Zap, 
      color: "text-blue-500 bg-blue-100 border-blue-200",
      unlocked: xp >= 1000
    },
    { 
      id: 3, 
      title: "Scholar", 
      desc: "Menyelesaikan 10 Unit pelajaran", 
      level: 2, 
      maxLevel: 5, 
      progress: 2, 
      target: 10, 
      icon: BookOpen, 
      color: "text-emerald-500 bg-emerald-100 border-emerald-200",
      unlocked: false
    },
    { 
      id: 4, 
      title: "Winner", 
      desc: "Juara #1 di Leaderboard Mingguan", 
      level: 0, 
      maxLevel: 1, 
      progress: 0, 
      target: 1, 
      icon: Trophy, 
      color: "text-yellow-500 bg-yellow-100 border-yellow-200",
      unlocked: false
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
              <StatCard icon={Flame} value="3" label="Day Streak" color="text-orange-500" />
              <StatCard icon={Zap} value={xp} label="Total XP" color="text-blue-500" />
              <StatCard icon={Medal} value="Silver" label="League" color="text-yellow-500" />
              <StatCard icon={Trophy} value="0" label="Top 3 Finishes" color="text-purple-500" />
            </div>
          </div>

          {/* 3. Pencapaian (Achievements) */}
          <div>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-200">Pencapaian</h2>
                <Button variant="ghost" className="text-blue-500 font-bold uppercase text-xs">Lihat Semua</Button>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
                {achievements.map((ach) => (
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
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${course.color}`}>
                                {course.image}
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
                    {["Sarah K.", "Budi S.", "Citra A."].map((friend, idx) => (
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