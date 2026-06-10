"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
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
import { CourseSelectorDropdown } from "@/components/shared/course-selector-dropdown";
import { StreakCalendarWidget } from "@/components/shared/streak-calendar-widget";
import { ComputedLessonNode, RoadmapNode } from "@/components/learn/roadmap-node";
import { AlertModal } from "@/components/shared/alert-modal";
import { EmptyState } from "@/components/ui/empty-state";

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
    resetProgress,
    activityHistory,
    role
  } = useUserStore();

  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: "", message: "", icon: <CheckCircle className="w-8 h-8" /> });

  // Data dari API
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [allCoursesList, setAllCoursesList] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [lessonNodes, setLessonNodes] = useState<any[]>([]);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch course info
      const coursesRes = await fetch('/api/courses');
      const allCourses = await coursesRes.json();
      setAllCoursesList(allCourses);
      const course = allCourses.find((c: any) => c.id === activeCourseId) || allCourses[0];
      setActiveCourse(course);

      // Fetch units + lessons
      const courseIdToFetch = course?.id || activeCourseId;
      const unitsRes = await fetch(`/api/courses/${courseIdToFetch}/units`);
      const unitsData = await unitsRes.json();

      setAllUnits(unitsData);

      // Gabungkan semua lesson dari semua unit ke dalam satu array roadmap
      const allLessons: any[] = [];
      for (const unit of unitsData) {
        for (const lesson of (unit.lessons || [])) {
          allLessons.push({
            ...lesson,
            unitId: unit.id,
            unitTitle: unit.title,
            unitDescription: unit.description,
          });
        }
      }
      setLessonNodes(allLessons);
    } catch (err) {
      console.error('Failed to fetch course data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCourseId]);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { if (isMounted && isLoggedIn) fetchCourseData(); }, [isMounted, isLoggedIn, fetchCourseData]);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  if (!isMounted || !isLoggedIn) return null;

  const theme = getCourseTheme(activeCourseId);

  // Hitung Peringkat & Leaderboard
  const computedLeaderboard = [
    ...INITIAL_LEADERBOARD,
    { userId: 'current', name: `${name} (You)`, score: weeklyXp, avatar: "bg-blue-200 text-blue-700", rank: 0, totalQuestions: 0, answeredQuestions: 0, accuracy: 0, lastUpdate: 0 }
  ];
  computedLeaderboard.sort((a, b) => b.score - a.score);
  const userRank = computedLeaderboard.findIndex(u => u.userId === 'current') + 1;

  const handleSimulateLesson = () => {
    const activeNodeData = lessonNodes.find((n: any) => !completedLessonIds.includes(String(n.id)));
    if (activeNodeData) {
      completeLesson(String(activeNodeData.id), true, activeNodeData.xpReward, activeNodeData.gemReward);
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
  const completedCount = lessonNodes.filter((n: any) => completedLessonIds.includes(String(n.id))).length;
  const totalCount = lessonNodes.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isUnitComplete = totalCount > 0 && progressPercent === 100;

  // Cari Node Aktif untuk Banner
  const activeNodeIndex = lessonNodes.findIndex((n: any, idx: number) => {
    const prevId = idx === 0 ? null : String(lessonNodes[idx - 1].id);
    const isPrevCompleted = prevId ? completedLessonIds.includes(prevId) : true;
    const isCurrCompleted = completedLessonIds.includes(String(n.id));
    return isPrevCompleted && !isCurrCompleted;
  });
  const activeNode = activeNodeIndex !== -1 ? lessonNodes[activeNodeIndex] : null;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Empty state: belum ada kursus di database
  if (!activeCourse) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <GraduationCap className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
        <h2 className="text-xl font-bold text-zinc-600 dark:text-zinc-400 mb-2">Belum ada kursus tersedia</h2>
        <p className="text-sm text-zinc-500 mb-4">Admin perlu menambahkan kursus dan lesson terlebih dahulu.</p>
        <Link href="/courses">
          <Button variant="outline">Lihat Halaman Kursus</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_max-content] gap-8">

        {/* =========================================
            KOLOM KIRI: MAIN CONTENT
           ========================================= */}
        <div className="flex flex-col gap-10">

          {/* STAT WIDGETS (MOBILE ONLY) */}
          <div className="flex lg:hidden items-center justify-between gap-2">
            <CourseSelectorDropdown courses={allCoursesList} />
            {role === 'mahasiswa' && (
              <>
                <StatWidget 
                  icon={Flame} color="text-orange-500" label="Streak" value={streak} href="/goals" 
                  hoverContent={<StreakCalendarWidget activityHistory={activityHistory} streak={streak} />} 
                />
                <StatWidget icon={Zap} color="text-blue-500" label="XP" value={xp} />
                <StatWidget icon={Trophy} color="text-yellow-500" label="Peringkat" value={userRank} prefix="#" href="/leaderboard" />
              </>
            )}
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
                  <h3 className="font-bold text-lg">Selamat! Kursus Selesai 🎉</h3>
                  <p className="text-sm opacity-90">Anda telah menyelesaikan seluruh materi di kursus {activeCourse?.title || 'ini'}.</p>
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
                <h2 className="text-lg sm:text-xl font-bold mb-1 flex items-start sm:items-center justify-center sm:justify-start gap-2">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 sm:mt-0" />
                  <span className="line-clamp-2 break-words">{activeCourse.title}</span>
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-md line-clamp-3 break-words mt-1.5">{activeCourse.description}</p>
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

            {/* Progress Bar Kursus Keseluruhan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="opacity-80">PROGRES KURSUS</span>
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

          {/* 2. UNIT-BASED ROADMAP — Setiap unit terpisah seperti Duolingo */}
          {allUnits.length === 0 ? (
            <EmptyState 
              icon={<GraduationCap className="w-12 h-12" />}
              title="Dojo Masih Kosong"
              description="Master belum memberikan gulungan instruksi. Silakan kembali nanti atau eksplorasi kelas lain sementara admin menyusun materi."
              animate="bounce"
              action={
                <Link href="/courses">
                  <Button variant="outline" className="font-bold">Kembali ke Daftar Kelas</Button>
                </Link>
              }
            />
          ) : (
            allUnits.map((unit: any, unitIdx: number) => {
              const unitLessons = unit.lessons || [];
              const unitCompletedCount = unitLessons.filter((l: any) => completedLessonIds.includes(String(l.id))).length;
              const unitTotalCount = unitLessons.length;
              const unitProgress = unitTotalCount > 0 ? Math.round((unitCompletedCount / unitTotalCount) * 100) : 0;
              const isUnitDone = unitTotalCount > 0 && unitProgress === 100;

              // Hitung index global lesson pertama unit ini (untuk activeNodeIndex matching)
              let globalStartIdx = 0;
              for (let i = 0; i < unitIdx; i++) {
                globalStartIdx += (allUnits[i].lessons || []).length;
              }

              return (
                <div key={unit.id} className="flex flex-col items-center gap-0">

                  {/* ===== UNIT HEADER BANNER ===== */}
                  <div className={`w-full rounded-2xl overflow-hidden shadow-lg mb-8 ${
                    isUnitDone
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : unitIdx === 0 || globalStartIdx <= activeNodeIndex
                        ? `${theme.bg}`
                        : 'bg-zinc-300 dark:bg-zinc-800'
                  }`}>
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                          isUnitDone
                            ? 'bg-white/20 text-white'
                            : unitIdx === 0 || globalStartIdx <= activeNodeIndex
                              ? 'bg-white/20 text-white'
                              : 'bg-zinc-400/30 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                        }`}>
                          {isUnitDone ? <CheckCircle className="w-6 h-6" /> : unitIdx + 1}
                        </div>
                        <div>
                          <h3 className={`font-bold text-sm sm:text-base line-clamp-2 break-words leading-tight ${
                            isUnitDone || unitIdx === 0 || globalStartIdx <= activeNodeIndex
                              ? 'text-white'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}>
                            {unit.title}
                          </h3>
                          {unit.description && (
                            <p className={`text-[10px] sm:text-xs mt-1.5 line-clamp-2 break-words leading-snug ${
                              isUnitDone || unitIdx === 0 || globalStartIdx <= activeNodeIndex
                                ? 'text-white/70'
                                : 'text-zinc-400 dark:text-zinc-500'
                            }`}>
                              {unit.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Mini progress */}
                      <div className="text-right">
                        <span className={`text-xs font-bold ${
                          isUnitDone || unitIdx === 0 || globalStartIdx <= activeNodeIndex
                            ? 'text-white/80'
                            : 'text-zinc-400'
                        }`}>
                          {unitCompletedCount}/{unitTotalCount}
                        </span>
                        <div className={`h-2 w-24 rounded-full overflow-hidden mt-1 ${
                          isUnitDone ? 'bg-white/20' : unitIdx === 0 || globalStartIdx <= activeNodeIndex ? 'bg-black/20' : 'bg-zinc-400/30 dark:bg-zinc-700'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${unitProgress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`h-full rounded-full ${isUnitDone ? 'bg-white' : 'bg-white/80'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ===== LESSON NODES DI DALAM UNIT ===== */}
                  <div className="w-full relative flex flex-col items-center">
                    <div className="flex flex-col items-center gap-28 sm:gap-16 relative z-20 w-full max-w-md mx-auto">
                      {unitLessons.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400 text-sm">
                          <p>Belum ada lesson di unit ini.</p>
                        </div>
                      ) : (
                        unitLessons.map((origLesson: any, lessonIdx: number) => {
                          const globalIdx = globalStartIdx + lessonIdx;
                          const isEven = lessonIdx % 2 === 0;
                          const isCompleted = completedLessonIds.includes(String(origLesson.id));

                          let computedType = 'locked';
                          if (isCompleted) {
                            computedType = 'completed';
                          } else if (globalIdx === activeNodeIndex) {
                            computedType = 'active';
                          } else if (globalIdx === activeNodeIndex + 1) {
                            computedType = 'next_locked';
                          } else {
                            computedType = 'far_locked';
                          }

                          const node: ComputedLessonNode = {
                            id: String(origLesson.id),
                            title: origLesson.title,
                            desc: origLesson.description || '',
                            type: computedType as ComputedLessonNode['type'],
                            duration: origLesson.duration,
                            xpReward: origLesson.xpReward,
                            gemReward: origLesson.gemReward
                          };

                          return (
                            <RoadmapNode
                              key={node.id}
                              node={node}
                              index={lessonIdx}
                              totalNodes={unitLessons.length}
                              isEven={isEven}
                            />
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Jarak (Spacing) bersih antar unit / akhir unit agar tidak tumpang tindih dengan widget */}
                  <div className={`w-full ${unitIdx < allUnits.length - 1 ? 'h-16' : 'h-32'}`} />
                </div>
              );
            })
          )}
        </div>

        {/* =========================================
            KOLOM KANAN: WIDGETS (Tetap Sama)
           ========================================= */}
        <div className="flex flex-col gap-6">
          <div className="hidden lg:flex items-center justify-between gap-2">
            <CourseSelectorDropdown courses={allCoursesList} />
            {role === 'mahasiswa' && (
              <div className="flex items-center gap-2 flex-1 justify-end">
                <StatWidget 
                  icon={Flame} color="text-orange-500" label="Streak" value={streak} href="/goals" 
                  hoverContent={<StreakCalendarWidget activityHistory={activityHistory} streak={streak} />} 
                />
                <StatWidget icon={Zap} color="text-blue-500" label="XP" value={xp} />
                <StatWidget icon={Trophy} color="text-yellow-500" label="Peringkat" value={userRank} prefix="#" href="/leaderboard" />
              </div>
            )}
          </div>

          {role === 'mahasiswa' && <DailyGoalWidget dailyGoals={dailyGoals} />}

          {role === 'mahasiswa' && (
            <Card className="hidden lg:block p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-sm text-zinc-500 mb-3">🔧 Debug / Testing</h3>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="secondary" onClick={handleSimulateLesson} className="w-full border border-zinc-200 h-8 text-xs hover:bg-white">
                  Simulasi Selesai Lesson (Klik Node Biru)
                </Button>
              </div>
            </Card>
          )}

          {role === 'mahasiswa' && (
            <LeaderboardWidget
              topUsers={computedLeaderboard}
              currentUserId="current"
              currentUserName={name}
              currentUserXp={weeklyXp}
              currentUserRank={userRank}
            />
          )}
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