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
  GraduationCap,
  Clock,
  ArrowRight,
  Play,
  PartyPopper,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { triggerConfetti } from "@/lib/confetti";
import { playSuccessSound } from "@/lib/sounds";
import { StatWidget } from "@/components/shared/stat-widget";
import { DailyGoalWidget } from "@/components/shared/daily-goal-widget";
import { LeaderboardWidget } from "@/components/shared/leaderboard-widget";
import { RoadmapNode, ComputedLessonNode } from "@/components/learn/roadmap-node";
import { AlertModal } from "@/components/shared/alert-modal";

// Helper: Warna tema berdasarkan kursus aktif
const getCourseTheme = (courseId: string) => {
  switch (courseId) {
    case 'fe-basic': return { bg: 'bg-pink-600', shadow: 'shadow-pink-600/20', text: 'text-pink-600', pill: 'bg-pink-600 shadow-pink-500/30 border-pink-400' };
    case 'react-mastery': return { bg: 'bg-blue-600', shadow: 'shadow-blue-600/20', text: 'text-blue-600', pill: 'bg-blue-600 shadow-blue-500/30 border-blue-400' };
    default: return { bg: 'bg-emerald-600', shadow: 'shadow-emerald-600/20', text: 'text-emerald-600', pill: 'bg-emerald-600 shadow-emerald-500/30 border-emerald-400' };
  }
};

export default function LearnPage() {
  const router = useRouter();

  // Ambil state dari Store
  const {
    isLoggedIn,
    name,
    level,
    xp,
    weeklyXp,
    activeCourseId,
    streak,
    dailyGoals,
    completeLesson,
    completedLessonIds,
    resetProgress
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);

  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "", message: "", icon: <CheckCircle className="w-8 h-8" /> });

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
  const theme = getCourseTheme(activeCourseId);

  // Hitung Peringkat & Leaderboard
  const computedLeaderboard = [
    ...INITIAL_LEADERBOARD,
    { userId: 'current', name: `${name} (You)`, score: weeklyXp, avatar: "bg-blue-200 text-blue-700", rank: 0, totalQuestions: 0, answeredQuestions: 0, accuracy: 0, lastUpdate: 0 }
  ];
  computedLeaderboard.sort((a, b) => b.score - a.score);
  const userRank = computedLeaderboard.findIndex(u => u.userId === 'current') + 1;

  const handleSimulateLesson = () => {
    // Cari node pertama yang belum diselesaikan dalam konten kursus saat ini
    const activeNode = currentContent.nodes.find((n: any) => !completedLessonIds.includes(n.id));

    if (activeNode) {
      completeLesson(activeNode.id, true, activeNode.xpReward, activeNode.gemReward);
      triggerConfetti();
      playSuccessSound();
    } else {
      setAlertConfig({
        isOpen: true,
        title: "Unit Selesai",
        message: "Semua materi di unit ini sudah Anda selesaikan!",
        icon: <CheckCircle className="w-10 h-10" />
      });
    }
  };

  // Hitung Progress Unit
  const completedCount = currentContent.nodes.filter((n: LessonNode) => completedLessonIds.includes(n.id)).length;
  const totalCount = currentContent.nodes.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isUnitComplete = progressPercent === 100;

  // Cari Node Aktif untuk Banner
  const activeNodeIndex = currentContent.nodes.findIndex((n: LessonNode, idx: number) => {
    const prevId = idx === 0 ? null : currentContent.nodes[idx - 1].id;
    const isPrevCompleted = prevId ? completedLessonIds.includes(prevId) : true;
    const isCurrCompleted = completedLessonIds.includes(n.id);
    return isPrevCompleted && !isCurrCompleted;
  });
  const activeNode = activeNodeIndex !== -1 ? currentContent.nodes[activeNodeIndex] : null;

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
            <StatWidget icon={Trophy} color="text-yellow-500" label="Peringkat" value={`#${userRank}`} />
          </div>

          {/* 0. CONTINUE BANNER or COMPLETION STATE */}
          {isUnitComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 rounded-2xl flex items-center justify-between gap-4 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <PartyPopper className="w-7 h-7 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Selamat! Unit Selesai 🎉</h3>
                  <p className="text-sm opacity-90">Anda telah menyelesaikan seluruh materi di {currentContent.unitTitle}.</p>
                </div>
              </div>
              <Link href="/courses">
                <Button size="sm" className="bg-white text-green-700 hover:bg-white/90 border-none gap-2 rounded-xl font-bold px-4">
                  Pilih Kursus Lain <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ) : activeNode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-xl border border-zinc-800 dark:border-zinc-200"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Play className="w-6 h-6 text-white fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Lanjutkan belajar!</h3>
                  <p className="text-xs opacity-70">Stage {activeNodeIndex + 1}: {activeNode.title}</p>
                </div>
              </div>
              <Link href={`/learn/lesson/${activeNode.id}`}>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-none gap-2 rounded-xl group px-4">
                  Lanjutkan <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          )}

          {/* 1. HEADER KURSUS (Card Warna-Warni) */}
          <div className={`p-6 rounded-2xl text-white shadow-lg flex flex-col gap-6 transition-colors duration-500 ${theme.bg} ${theme.shadow}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                    if (confirm("Apakah Anda yakin ingin mereset progress belajar Anda untuk keperluan testing?")) {
                      resetProgress();
                    }
                  }}
                  className="bg-black/20 hover:bg-black/40 border-none text-white transition-colors"
                  title="Reset Pembelajaran (Testing)"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Link href="/courses">
                  <Button variant="secondary" className={`font-bold whitespace-nowrap border-none shadow-md ${theme.text}`}>
                    Ganti Kursus
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress Bar Unit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="opacity-80">PROGRES UNIT</span>
                <span>{progressPercent}% ({completedCount}/{totalCount})</span>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>
          </div>

          {/* 2. ROADMAP AREA (Seamless / Tanpa Kotak Border) */}
          <div className="w-full relative min-h-[600px] flex flex-col items-center">

            {/* Header Unit (Floating Label) */}
            <div className="flex flex-col items-center relative mb-16 z-20">
              <span className={`px-6 py-2 text-white rounded-full text-sm font-bold shadow-lg border-2 ${theme.pill}`}>
                {currentContent.unitTitle}
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
                {currentContent.unitDesc}
              </p>
            </div>

            {/* --- MAP NODES --- */}
            <div className="w-full relative flex flex-col items-center">

              <div className="flex flex-col items-center gap-16 relative z-20 w-full max-w-md mx-auto">
                {currentContent.nodes.map((origNode: LessonNode, index: number) => {
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

                  const node: ComputedLessonNode = {
                    ...origNode,
                    type: computedType as ComputedLessonNode['type'],
                    duration: origNode.duration,
                    xpReward: origNode.xpReward,
                    gemReward: origNode.gemReward
                  };

                  return (
                    <RoadmapNode
                      key={node.id}
                      node={node}
                      index={index}
                      totalNodes={currentContent.nodes.length}
                      isEven={isEven}
                    />
                  );
                })}
              </div>

              {/* Footer Section: Next Unit */}
              <div className="mt-16 flex flex-col items-center gap-4 z-10 pb-10 relative">
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 w-2 h-11 z-0">
                  <div className="w-0 h-full border-l-[4px] border-dashed border-zinc-300 dark:border-zinc-700 mx-auto" />
                </div>
                <div className="p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-center w-64 grayscale opacity-70 relative z-20">
                  <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-500">Unit Selanjutnya</h3>
                  <p className="text-xs text-zinc-400 mt-1">Selesaikan {currentContent.unitTitle} untuk membuka.</p>
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
            <StatWidget icon={Trophy} color="text-yellow-500" label="Peringkat" value={`#${userRank}`} />
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

          <LeaderboardWidget
            topUsers={computedLeaderboard}
            currentUserId="current"
            currentUserName={name}
            currentUserXp={weeklyXp}
            currentUserRank={userRank}
          />
        </div>
      </div>

      <AlertModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
      />

    </div>
  );
}