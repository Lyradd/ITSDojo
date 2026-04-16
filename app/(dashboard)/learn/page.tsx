"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { COURSES } from "@/lib/dummydata"; 
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Flame, 
  Trophy, 
  Zap, 
  Lock, 
  Check, 
  Play, 
  GraduationCap,
  CheckCircle,
  BookOpen,
  Gem,
  Star
} from "lucide-react";
import { triggerConfetti } from "@/lib/utils"; 
import { AnimatedNumber } from "@/components/ui/animated-number"; 

// --- 1. DATA KONTEN DUMMY ---
const COURSE_CONTENT: any = {
  "fe-basic": {
    unitTitle: "Unit 1: HTML & CSS Basics",
    unitDesc: "Fondasi halaman web modern",
    nodes: [
      { id: 1, type: "completed", title: "HTML Structure", desc: "Tag & Element Dasar" },
      { id: 2, type: "active", title: "CSS Styling", desc: "Warna & Layout" },
      { id: 3, type: "locked", title: "Flexbox", desc: "Layout Responsif" },
      { id: 4, type: "locked", title: "Grid System", desc: "Layout 2 Dimensi" },
    ]
  },
  "react-mastery": {
    unitTitle: "Unit 1: React Components",
    unitDesc: "Membuat UI interaktif",
    nodes: [
      { id: 1, type: "active", title: "JSX Syntax", desc: "Javascript + XML" }, 
      { id: 2, type: "locked", title: "Props & State", desc: "Data Flow" },
    ]
  },
  "backend-ninja": {
    unitTitle: "Unit 1: Intro to API",
    unitDesc: "Dasar komunikasi server",
    nodes: [
      { id: 1, type: "active", title: "HTTP Methods", desc: "GET, POST, PUT" },
      { id: 2, type: "locked", title: "Express JS", desc: "Routing Dasar" },
      { id: 3, type: "locked", title: "Database", desc: "SQL Basics" },
    ]
  }
};

// --- 2. KOMPONEN STAT WIDGET ---
const StatWidget = ({ icon: Icon, color, label, value, href }: any) => {
  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 border-transparent bg-white dark:bg-zinc-900 shadow-sm ${href ? 'cursor-pointer hover:bg-zinc-100 hover:border-zinc-200 dark:hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95' : ''}`}>
      <Icon className={`w-6 h-6 ${color}`} fill="currentColor" />
      <div>
        <div className="font-bold text-lg leading-none">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </div>
        <div className="text-xs text-zinc-400 font-bold uppercase">{label}</div>
      </div>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
};

export default function LearnPage() {
  const router = useRouter();
  
  // Ambil state dari Store
  const { 
    isLoggedIn, 
    name, 
    level, 
    xp, 
    activeCourseId, 
    streak, 
    dailyGoals,      
    completeLesson,
    completedLessonIds
  } = useUserStore(); 

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  if (!isMounted || !isLoggedIn) return null;

  // Logika Data Kursus
  const activeCourse = COURSES.find(c => c.id === activeCourseId) || COURSES[0];
  const currentContent = COURSE_CONTENT[activeCourseId] || COURSE_CONTENT["fe-basic"];

  const handleSimulateLesson = () => {
    completeLesson();
    triggerConfetti();
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        
        {/* =========================================
            KOLOM KIRI: MAIN CONTENT
           ========================================= */}
        <div className="flex flex-col gap-10">
          
          {/* STAT WIDGETS (MOBILE ONLY) */}
          <div className="flex lg:hidden items-center justify-between gap-2">
            <StatWidget icon={Flame} color="text-orange-500" label="Streak" value={streak} href="/goals" />
            <StatWidget icon={Zap} color="text-blue-500" label="XP" value={xp} />
            <StatWidget icon={Trophy} color="text-yellow-500" label="Rank" value="#42" />
          </div>

          {/* 1. HEADER KURSUS (Card Warna-Warni) */}
          <div className={`p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${
            activeCourseId === 'fe-basic' ? 'bg-pink-600 shadow-pink-600/20' : 
            activeCourseId === 'react-mastery' ? 'bg-blue-600 shadow-blue-600/20' : 
            'bg-emerald-600 shadow-emerald-600/20'
          }`}>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold mb-1 flex items-center justify-center sm:justify-start gap-2">
                <GraduationCap className="w-6 h-6" />
                {activeCourse.title}
              </h2>
              <p className="text-white/80 text-sm max-w-md">{activeCourse.description}</p>
            </div>
            <Link href="/courses">
               <Button variant="secondary" className={`font-bold whitespace-nowrap border-none shadow-md ${
                 activeCourseId === 'fe-basic' ? 'text-pink-600' : 
                 activeCourseId === 'react-mastery' ? 'text-blue-600' : 
                 'text-emerald-600'
               }`}>
                 Ganti Kursus
               </Button>
            </Link>
          </div>

          {/* 2. ROADMAP AREA (Seamless / Tanpa Kotak Border) */}
          <div className="w-full relative min-h-[600px] flex flex-col items-center">
            
             {/* Header Unit (Floating Label) */}
             <div className="flex flex-col items-center relative mb-16 z-20">
                <span className={`px-6 py-2 text-white rounded-full text-sm font-bold shadow-lg border-2 ${
                    activeCourseId === 'fe-basic' ? 'bg-pink-600 shadow-pink-500/30 border-pink-400' : 
                    activeCourseId === 'react-mastery' ? 'bg-blue-600 shadow-blue-500/30 border-blue-400' : 
                    'bg-emerald-600 shadow-emerald-500/30 border-emerald-400'
                }`}>
                  {currentContent.unitTitle}
                </span>
                <p className="text-xs text-zinc-500 font-medium mt-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-200/50">
                  {currentContent.unitDesc}
                </p>
             </div>

             {/* --- MAP NODES --- */}
             <div className="w-full relative flex flex-col items-center">
                
                {/* Garis Konektor Putus-putus Tengah */}
                {/* Kita buat z-index 0 agar berada di belakang node */}
                <div className="absolute top-0 bottom-10 left-1/2 w-0.5 -ml-[1px] bg-transparent border-l-2 border-dashed border-zinc-300 dark:border-zinc-700 h-full z-0" />

                <div className="flex flex-col items-center gap-16 relative z-10 w-full max-w-md mx-auto">
                   
                   {currentContent.nodes.map((origNode: any, index: number) => {
                      const isEven = index % 2 === 0;
                      
                      // LOGIKA UNLOCK PROGRESSIVE JIKA Node Sebelumnya Selesai
                      const fullLessonId = `${activeCourseId}-${origNode.id}`;
                      const isCompleted = completedLessonIds.includes(fullLessonId);
                      
                      const prevFullLessonId = index === 0 ? null : `${activeCourseId}-${currentContent.nodes[index-1].id}`;
                      const isPrevCompleted = prevFullLessonId ? completedLessonIds.includes(prevFullLessonId) : true;
                      
                      let computedType = origNode.type; // Fallback
                      if (isCompleted) {
                        computedType = 'completed';
                      } else if (isPrevCompleted) {
                        computedType = 'active';
                      } else {
                        computedType = 'locked';
                      }
                      
                      const node = { ...origNode, type: computedType };

                      return (
                        <div key={node.id} className="relative group w-full flex justify-center">
                            
                            {/* --- NODE: COMPLETED --- */}
                            {node.type === 'completed' && (
                              <div className="relative cursor-pointer" onClick={() => router.push(`/learn/lesson/${activeCourseId}-${node.id}`)}>
                                {/* Tooltip Label */}
                                <div className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-all group-hover:shadow-md group-hover:scale-105 ${isEven ? 'left-[calc(50%+40px)] origin-left' : 'right-[calc(50%+40px)] origin-right text-right'}`}>
                                  <span className="text-zinc-400 text-[10px] uppercase block mb-0.5">Stage {index + 1}</span>
                                  <span className="text-green-600 dark:text-green-400">{node.title}</span>
                                  
                                  {/* INFO OVERVIEW ON HOVER */}
                                  <div className="max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col">
                                     <p className="text-xs text-zinc-500 font-normal mb-2 whitespace-normal min-w-[140px] text-left">{node.desc}</p>
                                     <div className={`flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-[10px] text-green-700 dark:text-green-400 w-fit ${!isEven && 'self-end'}`}>
                                       <CheckCircle className="w-3 h-3" /> Diselesaikan
                                     </div>
                                  </div>
                                </div>

                                {/* Lingkaran Icon */}
                                <div className="w-20 h-20 rounded-full bg-green-500 border-b-[6px] border-green-700 flex items-center justify-center shadow-xl shadow-green-200 dark:shadow-none transition-transform active:scale-95 z-20 relative">
                                  <Check className="w-9 h-9 text-white stroke-[4]" />
                                </div>
                                
                                {/* Bintang Reward */}
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1 bg-white dark:bg-zinc-900 px-2 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm z-30">
                                  {[1,2,3].map(i => <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />)}
                                </div>
                              </div>
                            )}

                            {/* --- NODE: ACTIVE --- */}
                            {node.type === 'active' && (
                              <div className="relative cursor-pointer" onClick={() => router.push(`/learn/lesson/${activeCourseId}-${node.id}`)}>
                                {/* Efek Ping (Radar) */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-blue-500 animate-ping opacity-20" />

                                {/* Label 'MULAI!' Floating */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-extrabold shadow-md animate-bounce whitespace-nowrap z-40 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-blue-600">
                                  MULAI!
                                </div>

                                {/* Tooltip Label */}
                                <div className={`absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-zinc-900 border-2 border-blue-200 dark:border-blue-800 px-4 py-3 rounded-xl text-sm font-bold shadow-md transition-all group-hover:shadow-xl group-hover:scale-105 ${isEven ? 'left-[calc(50%+48px)] origin-left' : 'right-[calc(50%+48px)] origin-right text-right'}`}>
                                  <span className="text-blue-500 dark:text-blue-400 text-[10px] uppercase block mb-0.5 animate-pulse">👉 Saat Ini (Stage {index + 1})</span>
                                  <span className="text-zinc-800 dark:text-white text-base">{node.title}</span>
                                  
                                  {/* INFO OVERVIEW ON HOVER */}
                                  <div className="max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col">
                                     <p className="text-xs text-zinc-500 font-normal mb-3 whitespace-normal min-w-[160px] text-left">{node.desc}</p>
                                     <div className={`flex flex-col gap-1.5 ${!isEven ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded text-[10px] text-blue-700 dark:text-blue-300 w-fit">
                                          <Zap className="w-3 h-3 block" /> <span className="block">+50 XP</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-cyan-100 dark:bg-cyan-900/40 px-2 py-1 rounded text-[10px] text-cyan-700 dark:text-cyan-300 w-fit">
                                          <Gem className="w-3 h-3 block" /> <span className="block">+10 Gems</span>
                                        </div>
                                     </div>
                                  </div>
                                </div>

                                {/* Lingkaran Icon Utama */}
                                <div className="w-24 h-24 rounded-full bg-blue-500 border-b-[8px] border-blue-700 flex items-center justify-center shadow-2xl shadow-blue-300/50 dark:shadow-blue-900/50 transition-transform hover:scale-105 active:scale-95 relative overflow-hidden ring-4 ring-white dark:ring-zinc-900 z-20">
                                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
                                  <Play className="w-10 h-10 text-white fill-current ml-1" />
                                </div>
                              </div>
                            )}

                            {/* --- NODE: LOCKED --- */}
                            {node.type === 'locked' && (
                              <div className="relative opacity-80 cursor-not-allowed">
                                {/* Tooltip Label */}
                                <div className={`absolute top-1/2 -translate-y-1/2 z-30 px-4 py-2 rounded-xl text-sm font-bold opacity-60 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 backdrop-blur-sm transition-all group-hover:opacity-100 group-hover:shadow-md ${isEven ? 'left-[calc(50%+40px)] origin-left' : 'right-[calc(50%+40px)] origin-right text-right'}`}>
                                  <span className="text-zinc-400 text-[10px] uppercase block mb-0.5">Stage {index + 1}</span>
                                  <span className="text-zinc-600 dark:text-zinc-400">{node.title}</span>
                                  
                                  {/* INFO OVERVIEW ON HOVER */}
                                  <div className="max-h-0 opacity-0 group-hover:max-h-32 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col">
                                     <p className="text-[11px] text-zinc-400 font-normal mb-2 whitespace-normal min-w-[150px] text-left">Belum terbuka. Selesaikan stage sebelumnya terlebih dahulu.</p>
                                     <div className={`flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-500 w-fit ${!isEven && 'self-end'}`}>
                                       <Lock className="w-3 h-3" /> Terkunci
                                     </div>
                                  </div>
                                </div>

                                {/* Lingkaran Icon */}
                                <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 border-b-[6px] border-zinc-300 dark:border-zinc-700 flex items-center justify-center grayscale ring-4 ring-white dark:ring-zinc-900 z-20">
                                  <Lock className="w-8 h-8 text-zinc-400" />
                                </div>
                              </div>
                            )}
                        </div>
                      );
                   })}
                </div>

                {/* Footer Section: Next Unit */}
                <div className="mt-16 flex flex-col items-center gap-4 z-10 pb-10">
                  <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-center w-64 grayscale opacity-70">
                     <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                       <Lock className="w-5 h-5 text-zinc-400" />
                     </div>
                     <h3 className="text-sm font-bold text-zinc-500">Unit 2: Lanjutan</h3>
                     <p className="text-xs text-zinc-400 mt-1">Selesaikan Unit 1 untuk membuka.</p>
                  </div>
                </div>

             </div>
          </div>
        </div>

        {/* =========================================
            KOLOM KANAN: WIDGETS (Tetap Sama)
           ========================================= */}
        <div className="flex flex-col gap-6">
          <div className="hidden lg:flex items-center justify-between gap-2">
            <StatWidget icon={Flame} color="text-orange-500" label="Streak" value={streak} href="/goals" />
            <StatWidget icon={Zap} color="text-blue-500" label="XP" value={xp} />
            <StatWidget icon={Trophy} color="text-yellow-500" label="Rank" value="#42" />
          </div>

          <Card className="hidden lg:block p-4 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200">Daily Goals</h3>
              <Link href="/goals" className="text-blue-500 font-bold text-xs uppercase hover:underline">Lihat Semua</Link>
            </div>
            <div className="space-y-4">
               {dailyGoals.map((goal) => (
                 <div key={goal.id} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                      goal.isCompleted ? 'bg-green-100 text-green-600' : 
                      goal.type === 'xp' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                    }`}>
                       {goal.isCompleted ? <CheckCircle className="w-5 h-5" /> : 
                        goal.type === 'xp' ? <Zap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between text-sm font-bold mb-1">
                          <span className={goal.isCompleted ? "text-green-600 line-through decoration-2" : "text-zinc-700 dark:text-zinc-300"}>
                            {goal.title}
                          </span>
                          <span className="text-zinc-400">{goal.current}/{goal.target}</span>
                       </div>
                       <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
                          <div 
                            className={`h-full transition-all duration-700 ease-out ${goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }} 
                          />
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </Card>

          <Card className="hidden lg:block p-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50">
            <h3 className="font-bold text-sm text-zinc-500 mb-3">🔧 Debug / Testing</h3>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="secondary" onClick={handleSimulateLesson} className="w-full border border-zinc-200 h-8 text-xs hover:bg-white">
                Simulasi Selesai Lesson (Klik Node Biru)
              </Button>
            </div>
          </Card>

          <Card className="hidden lg:block p-4 rounded-2xl border-2">
             <h3 className="font-bold text-lg text-zinc-700 dark:text-zinc-200 mb-4">Leaderboard</h3>
             <div className="space-y-3">
                {[
                    { name: "Sarah K.", xp: 1250, rank: 1, avatar: "bg-pink-200 text-pink-700" }, 
                    { name: `${name} (You)`, xp: xp, rank: 42, avatar: "bg-blue-200 text-blue-700" }
                ].map((user, idx) => (
                   <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl ${user.name.includes("You") ? "bg-blue-50 border border-blue-100" : ""}`}>
                      <div className="font-bold text-zinc-400 w-6">{user.rank}</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${user.avatar}`}>{user.name.charAt(0)}</div>
                      <div className="flex-1 font-bold text-sm truncate">{user.name}</div>
                      <div className="text-xs font-bold text-zinc-400">
                        {user.name.includes("You") ? <AnimatedNumber value={user.xp} /> : user.xp} XP
                      </div>
                   </div>
                ))}
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
}