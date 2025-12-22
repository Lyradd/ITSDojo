"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { COURSES } from "@/lib/dummydata"; // Import Data Master
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, Zap, ArrowRight, Lock, CheckCircle, Star, GraduationCap } from "lucide-react";

// --- DATA KONTEN DUMMY (Beda course, beda isi) ---
const COURSE_CONTENT: any = {
  "fe-basic": {
    unitTitle: "Unit 1: HTML & CSS Basics",
    unitDesc: "Fondasi halaman web",
    nodes: [
      { id: 1, type: "completed", icon: CheckCircle, color: "bg-amber-500 border-amber-700" },
      { id: 2, type: "active", icon: Star, color: "bg-blue-500 border-blue-700" },
      { id: 3, type: "locked", icon: Lock, color: "bg-zinc-200 border-zinc-300" },
      { id: 4, type: "locked", icon: Lock, color: "bg-zinc-200 border-zinc-300" },
    ]
  },
  "react-mastery": {
    unitTitle: "Unit 1: React Components",
    unitDesc: "Membuat UI interaktif",
    nodes: [
      { id: 1, type: "active", icon: Star, color: "bg-cyan-500 border-cyan-700" }, // Warna beda (Cyan)
      { id: 2, type: "locked", icon: Lock, color: "bg-zinc-200 border-zinc-300" },
    ]
  },
  "backend-ninja": {
    unitTitle: "Unit 1: Intro to API",
    unitDesc: "Dasar komunikasi server",
    nodes: [
      { id: 1, type: "active", icon: Star, color: "bg-emerald-500 border-emerald-700" }, // Warna beda (Emerald)
      { id: 2, type: "locked", icon: Lock, color: "bg-zinc-200 border-zinc-300" },
      { id: 3, type: "locked", icon: Lock, color: "bg-zinc-200 border-zinc-300" },
    ]
  }
};

export default function LearnPage() {
  const router = useRouter();
  const { isLoggedIn, name, level, xp, activeCourseId } = useUserStore(); // Ambil activeCourseId
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  if (!isMounted || !isLoggedIn) return null;

  // 1. Ambil Detail Kursus Aktif
  const activeCourse = COURSES.find(c => c.id === activeCourseId) || COURSES[0];
  
  // 2. Ambil Konten Unit sesuai ID (Fallback ke default jika tidak ada)
  const currentContent = COURSE_CONTENT[activeCourseId] || COURSE_CONTENT["fe-basic"];

  const StatWidget = ({ icon: Icon, color, label, value }: any) => (
    <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
      <Icon className={`w-6 h-6 ${color}`} fill="currentColor" />
      <div>
        <div className="font-bold text-lg leading-none">{value}</div>
        <div className="text-xs text-zinc-400 font-bold uppercase">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        
        {/* === KOLOM KIRI: DYNAMIC LEARNING PATH === */}
        <div className="flex flex-col gap-6">
          
          {/* Header Kursus Aktif (Warna mengikuti kursus) */}
          <div className={`p-6 rounded-2xl text-white shadow-lg flex items-center justify-between transition-colors duration-500 ${
            activeCourseId === 'fe-basic' ? 'bg-pink-600 shadow-pink-600/20' : 
            activeCourseId === 'react-mastery' ? 'bg-blue-600 shadow-blue-600/20' : 
            'bg-emerald-600 shadow-emerald-600/20'
          }`}>
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <GraduationCap className="w-6 h-6" />
                {activeCourse.title}
              </h2>
              <p className="text-white/80 text-sm">{activeCourse.description.substring(0, 60)}...</p>
            </div>
            <Link href="/courses">
               <Button variant="secondary" className={`font-bold whitespace-nowrap ${
                 activeCourseId === 'fe-basic' ? 'text-pink-600' : 
                 activeCourseId === 'react-mastery' ? 'text-blue-600' : 
                 'text-emerald-600'
               }`}>
                 Ganti Kursus
               </Button>
            </Link>
          </div>

          {/* Unit Visualization (Konten Berubah) */}
          <div className="space-y-8 mt-4">
            <div className="flex items-center justify-between border-b pb-4">
               <div>
                 <h3 className="text-xl font-extrabold text-zinc-700 dark:text-zinc-200">
                    {currentContent.unitTitle}
                 </h3>
                 <p className="text-zinc-500">{currentContent.unitDesc}</p>
               </div>
               <Button size="sm" variant="outline" className="border-2 font-bold text-zinc-500 border-zinc-200 hover:bg-zinc-50">
                  Lihat Panduan
               </Button>
            </div>

            {/* Render Nodes Dinamis */}
            <div className="flex flex-col items-center gap-4 relative py-4">
               {currentContent.nodes.map((node: any, index: number) => (
                 <div key={index} className="flex flex-col items-center">
                    <div className="relative z-10">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center border-b-4 shadow-xl cursor-pointer hover:scale-105 transition-transform ${node.color} ${node.type === 'locked' ? 'grayscale opacity-70' : ''}`}>
                          <node.icon className="w-8 h-8 text-white" fill={node.type !== 'locked' ? "currentColor" : "none"} />
                        </div>
                        {node.type === 'completed' && (
                          <div className="absolute top-2 right-[-60px] bg-white border px-3 py-1 rounded-lg text-xs font-bold shadow-sm animate-bounce text-zinc-700">
                            Selesai!
                          </div>
                        )}
                    </div>
                    {/* Connector Line (Kecuali item terakhir) */}
                    {index < currentContent.nodes.length - 1 && (
                      <div className="w-2 h-12 bg-zinc-200 rounded-full my-2" />
                    )}
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* === KOLOM KANAN (Widgets) - Tetap Sama === */}
        <div className="flex flex-col gap-6">
          {/* Stats Row */}
          <div className="flex items-center justify-between gap-2">
            <StatWidget icon={Flame} color="text-orange-500" label="Streak" value="3" />
            <StatWidget icon={Zap} color="text-blue-500" label="XP" value={xp} />
            <StatWidget icon={Trophy} color="text-yellow-500" label="Rank" value="#42" />
          </div>

          {/* Daily Goals */}
          <Card className="p-4 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Daily Goals</h3>
              <Link href="/goals" className="text-blue-500 font-bold text-xs uppercase hover:underline">Lihat Semua</Link>
            </div>
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600"><Zap className="w-5 h-5" /></div>
                  <div className="flex-1">
                     <div className="flex justify-between text-sm font-bold mb-1"><span>Dapatkan 50 XP</span><span className="text-zinc-400">20/50</span></div>
                     <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[40%]" /></div>
                  </div>
               </div>
            </div>
          </Card>

           {/* TEMPORARY: DEBUG TOOLS */}
          <Card className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50">
            <h3 className="font-bold text-sm text-zinc-500 mb-2">🔧 Debug Mode</h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => useUserStore.getState().addXp(20)}>+20 XP</Button>
            </div>
          </Card>

          {/* Leaderboard Preview */}
          <Card className="p-4 rounded-2xl border-2">
             <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200 mb-4">Leaderboard</h3>
             <div className="space-y-3">
                {[{ name: "Sarah K.", xp: 1250, rank: 1, avatar: "bg-pink-200 text-pink-700" }, { name: "Daryl (You)", xp: xp, rank: 42, avatar: "bg-blue-200 text-blue-700" }].map((user, idx) => (
                   <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl ${user.name.includes("You") ? "bg-blue-50 border border-blue-100" : ""}`}>
                      <div className="font-bold text-zinc-400 w-6">{user.rank}</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.avatar}`}>{user.name.charAt(0)}</div>
                      <div className="flex-1 font-bold text-sm">{user.name}</div>
                      <div className="text-xs font-bold text-zinc-400">{user.xp} XP</div>
                   </div>
                ))}
             </div>
          </Card>

          {/* Profile Box */}
          <div className="border-t pt-6 mt-2 text-center">
             <div className="w-24 h-24 mx-auto bg-zinc-100 rounded-full border-4 border-white shadow-lg mb-3 flex items-center justify-center text-3xl font-bold text-blue-600 bg-blue-50">
               {name.charAt(0)}
             </div>
             <h3 className="font-bold text-xl">{name}</h3>
             <p className="text-zinc-500 text-sm mb-4">Level {level} Student</p>
             <Link href="/profile"><Button variant="outline" className="w-full border-2 font-bold uppercase tracking-wide">Lihat Profil</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}