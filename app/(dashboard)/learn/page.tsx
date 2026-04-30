"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { COURSES } from "@/lib/dummydata";
import { COURSE_CONTENT, LessonNode } from "@/lib/lesson-data";
import { INITIAL_LEADERBOARD } from "@/lib/evaluation-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Flame,
  Trophy,
  Zap,
  Lock,
  RotateCcw,
  GraduationCap
} from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { playSuccessSound } from "@/lib/sounds";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { StatWidget } from "@/components/shared/stat-widget";
import { DailyGoalWidget } from "@/components/shared/daily-goal-widget";
import { LeaderboardWidget } from "@/components/shared/leaderboard-widget";
import { RoadmapNode, ComputedLessonNode } from "@/components/learn/roadmap-node";

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
    completedLessonIds,
    resetProgress
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

  // Hitung Peringkat & Leaderboard
  const computedLeaderboard = [
    ...INITIAL_LEADERBOARD,
    { userId: 'current', name: `${name} (You)`, score: xp, avatar: "bg-blue-200 text-blue-700", rank: 0, totalQuestions: 0, answeredQuestions: 0, accuracy: 0, lastUpdate: 0 }
  ];
  computedLeaderboard.sort((a, b) => b.score - a.score);
  const userRank = computedLeaderboard.findIndex(u => u.userId === 'current') + 1;
  const topUser = computedLeaderboard[0];

  const handleSimulateLesson = () => {
    // Cari node pertama yang belum diselesaikan dalam konten kursus saat ini
    const activeNode = currentContent.nodes.find((n: any) => !completedLessonIds.includes(n.id));
    
    if (activeNode) {
      completeLesson(activeNode.id);
      triggerConfetti();
      playSuccessSound();
    } else {
      alert("Semua materi di unit ini sudah diselesaikan!");
    }
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
            <StatWidget icon={Trophy} color="text-yellow-500" label="Rank" value={`#${userRank}`} />
          </div>

          {/* 1. HEADER KURSUS (Card Warna-Warni) */}
          <div className={`p-6 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-500 ${activeCourseId === 'fe-basic' ? 'bg-pink-600 shadow-pink-600/20' :
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
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                   if(confirm("Apakah Anda yakin ingin mereset progress belajar Anda untuk keperluan testing?")) {
                      resetProgress();
                   }
                }}
                className="bg-black/20 hover:bg-black/40 border-none text-white transition-colors"
                title="Reset Pembelajaran (Testing)"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Link href="/courses">
                <Button variant="secondary" className={`font-bold whitespace-nowrap border-none shadow-md ${activeCourseId === 'fe-basic' ? 'text-pink-600' :
                    activeCourseId === 'react-mastery' ? 'text-blue-600' :
                      'text-emerald-600'
                  }`}>
                  Ganti Kursus
                </Button>
              </Link>
            </div>
          </div>

          {/* 2. ROADMAP AREA (Seamless / Tanpa Kotak Border) */}
          <div className="w-full relative min-h-[600px] flex flex-col items-center">

            {/* Header Unit (Floating Label) */}
            <div className="flex flex-col items-center relative mb-16 z-20">
              <span className={`px-6 py-2 text-white rounded-full text-sm font-bold shadow-lg border-2 ${activeCourseId === 'fe-basic' ? 'bg-pink-600 shadow-pink-500/30 border-pink-400' :
                  activeCourseId === 'react-mastery' ? 'bg-blue-600 shadow-blue-500/30 border-blue-400' :
                    'bg-emerald-600 shadow-emerald-500/30 border-emerald-400'
                }`}>
                {currentContent.unitTitle}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
                {currentContent.unitDesc}
              </p>
            </div>

            {/* --- MAP NODES --- */}
            <div className="w-full relative flex flex-col items-center">

              <div className="flex flex-col items-center gap-16 relative z-10 w-full max-w-md mx-auto">
                {(() => {
                   const activeNodeIndex = currentContent.nodes.findIndex((n: LessonNode, idx: number) => {
                      const prevId = idx === 0 ? null : currentContent.nodes[idx-1].id;
                      const isPrevCompleted = prevId ? completedLessonIds.includes(prevId) : true;
                      const isCurrCompleted = completedLessonIds.includes(n.id);
                      return isPrevCompleted && !isCurrCompleted;
                   });

                   return currentContent.nodes.map((origNode: LessonNode, index: number) => {
                      const isEven = index % 2 === 0;
                      
                      const isCompleted = completedLessonIds.includes(origNode.id);
                      
                      let computedType = 'locked';
                      if (isCompleted) {
                        computedType = 'completed';
                      } else if (index === activeNodeIndex) {
                        computedType = 'active';
                      } else if (index === activeNodeIndex + 1) {
                        computedType = 'next_locked';
                      } else {
                        computedType = 'far_locked';
                      }
                      
                      const node: ComputedLessonNode = { ...origNode, type: computedType as ComputedLessonNode['type'] };

                      return (
                        <RoadmapNode
                          key={node.id}
                          node={node}
                          index={index}
                          totalNodes={currentContent.nodes.length}
                          isEven={isEven}
                        />
                      );
                })})()}
              </div>

              {/* Footer Section: Next Unit */}
              <div className="mt-16 flex flex-col items-center gap-4 z-10 pb-10 relative">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-2 h-16 z-0">
                  <div className="w-0 h-full border-l-[4px] border-dashed border-zinc-300 dark:border-zinc-700 mx-auto" />
                </div>
                <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-center w-64 grayscale opacity-70 relative z-20">
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
            <StatWidget icon={Trophy} color="text-yellow-500" label="Rank" value={`#${userRank}`} />
          </div>

          <DailyGoalWidget dailyGoals={dailyGoals} />

          <Card className="hidden lg:block p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <h3 className="font-bold text-sm text-zinc-500 mb-3">🔧 Debug / Testing</h3>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="secondary" onClick={handleSimulateLesson} className="w-full border border-zinc-200 h-8 text-xs hover:bg-white">
                Simulasi Selesai Lesson (Klik Node Biru)
              </Button>
            </div>
          </Card>

          <LeaderboardWidget topUser={topUser as any} name={name} xp={xp} userRank={userRank} />
        </div>

      </div>
    </div>
  );
}