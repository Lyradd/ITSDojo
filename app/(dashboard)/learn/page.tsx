"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUserStore } from "@/lib/store";
import { completeLessonAction, resetLearningProgressAction } from "@/actions/gamification";
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
import { CourseSelectorDropdown } from "@/components/shared/course-selector-dropdown";
import { ComputedLessonNode, RoadmapNode } from "@/components/learn/roadmap-node";
import { EmptyState } from "@/components/ui/empty-state";
import dynamic from "next/dynamic";

const DailyGoalWidget = dynamic(() => import("@/components/shared/daily-goal-widget").then(mod => mod.DailyGoalWidget));
const LeaderboardWidget = dynamic(() => import("@/components/shared/leaderboard-widget").then(mod => mod.LeaderboardWidget));
const StreakCalendarWidget = dynamic(() => import("@/components/shared/streak-calendar-widget").then(mod => mod.StreakCalendarWidget));
const AlertModal = dynamic(() => import("@/components/shared/alert-modal").then(mod => mod.AlertModal), { ssr: false });
import { StreakDisplay } from "@/components/shared/streak-display";

// removed getCourseTheme helper since headers are now standardized

export default function LearnPage() {
  const router = useRouter();

  // Ambil state dari Store
  const {
    isLoggedIn,
    name,
    level,
    xp,
    weeklyXp,
    xpToNextLevel,
    activeCourseId,
    setActiveCourse: setZustandActiveCourse,
    semester,
    streak,
    dailyGoals,
    completeLesson,
    completedLessonIds,
    updateProfile,
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
      // Fetch course info with user semester parameter to prioritize correctly
      const coursesRes = await fetch(`/api/courses?semester=${semester}`);
      const allCourses = await coursesRes.json();
      setAllCoursesList(allCourses);
      
      // LOGIKA CERDAS: Pilih active course berdasarkan semester
      let courseToActivate = null;
      
      // Jika pengguna sudah pernah memilih course aktif sebelumnya, gunakan itu
      if (activeCourseId) {
         courseToActivate = allCourses.find((c: any) => c.id === activeCourseId);
      }
      
      // Jika tidak ada active course, cari course yang cocok dengan semesternya
      if (!courseToActivate) {
         courseToActivate = allCourses.find((c: any) => c.requiredSemester === semester);
      }
      
      // Fallback terakhir: Ambil index 0 (karena API sudah di-order berdasarkan semester di backend)
      if (!courseToActivate) {
         courseToActivate = allCourses[0];
      }

      setActiveCourse(courseToActivate);
      
      // Simpan preferensi default ke state lokal jika sebelumnya belum ada
      if (!activeCourseId && courseToActivate) {
         setZustandActiveCourse(courseToActivate.id);
      }

      // Fetch units + lessons
      const courseIdToFetch = courseToActivate?.id;
      if (!courseIdToFetch) return; // Guard jika tidak ada course sama sekali

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
  }, [activeCourseId, semester, setZustandActiveCourse]);

  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => { 
    // Mencegah Race Condition: Pastikan data user (terutama semester) sudah siap dari Zustand
    if (isMounted && isLoggedIn && semester !== undefined) {
      fetchCourseData(); 
    }
  }, [isMounted, isLoggedIn, semester, fetchCourseData]);

  useEffect(() => {
    if (isMounted && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router, isMounted]);

  if (!isMounted || !isLoggedIn) return null;

  // Theme logic is now inline

  // Hitung Peringkat & Leaderboard
  const computedLeaderboard = [
    ...INITIAL_LEADERBOARD,
    { userId: 'current', name: `${name} (You)`, score: weeklyXp, avatar: "bg-blue-200 text-blue-700", rank: 0, totalQuestions: 0, answeredQuestions: 0, accuracy: 0, lastUpdate: 0 }
  ];
  computedLeaderboard.sort((a, b) => b.score - a.score);
  const userRank = computedLeaderboard.findIndex(u => u.userId === 'current') + 1;

  const handleSimulateLesson = async () => {
    const activeNodeData = lessonNodes.find((n: any) => !completedLessonIds.includes(String(n.id)));
    if (activeNodeData) {
      const res = await completeLessonAction(String(activeNodeData.id), true, activeNodeData.xpReward, activeNodeData.gemReward);
      if (res.success) {
        const didLevelUp = (res.newLevel || level) > level;
        const levelUpPayload = didLevelUp ? {
          isLevelUpModalOpen: true,
          levelUpData: { oldLevel: level, newLevel: res.newLevel as number, gemsGained: ((res.newLevel as number) - level) * 50 }
        } : {};

        updateProfile({
          xp: res.newXp,
          weeklyXp: res.newLeaderboardXp,
          gems: res.newGems,
          level: res.newLevel,
          streak: res.newStreak,
          completedLessonIds: res.isNew ? [...completedLessonIds, String(activeNodeData.id)] : completedLessonIds,
          activityHistory: res.gamificationData.activityHistory,
          lastActiveDate: res.gamificationData.lastActiveDate,
          dailyGoals: res.gamificationData.dailyGoals,
          ...levelUpPayload
        });
        completeLesson(String(activeNodeData.id), true);
        triggerConfetti();
        playSuccessSound();
      }
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
          <div className="w-full grid grid-cols-4 gap-2 lg:hidden">
            <div className="flex items-center justify-center">
              <CourseSelectorDropdown courses={allCoursesList} />
            </div>
            {role === 'mahasiswa' && (
              <>
                <div className="flex items-center justify-center">
                  <StreakDisplay 
                    variant="stat-widget" 
                    hoverContent={<Suspense fallback={<div className="w-64 h-64 bg-zinc-900 rounded-2xl animate-pulse" />}><StreakCalendarWidget activityHistory={activityHistory} streak={streak} /></Suspense>} 
                  />
                </div>
                <div className="flex items-center justify-center">
                  <StatWidget 
                    align="center"
                    icon={Zap} color="text-blue-500" label="XP" value={xp} href="/profile"
                    hoverContent={
                      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-xl p-3 w-48 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">XP Saya</div>
                        <div className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-1">Level {level}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-300">
                          Butuh <strong className="text-zinc-900 dark:text-zinc-100">{xpToNextLevel} XP</strong> lagi untuk naik level!
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="flex items-center justify-center">
                  <StatWidget align="center" icon={Trophy} color="text-yellow-500" label="Peringkat" value={userRank} prefix="#" href="/leaderboard" />
                </div>
              </>
            )}
          </div>

          {/* 0. CONTINUE BANNER or COMPLETION STATE */}
          {isUnitComplete ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-4 shadow-xl"
            >
              <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <PartyPopper className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg leading-tight">Selamat! Kursus Selesai 🎉</h3>
                  <p className="text-sm opacity-90 mt-1 line-clamp-2">Anda telah menyelesaikan seluruh materi di kursus {activeCourse?.title || 'ini'}.</p>
                </div>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto bg-white text-green-700 hover:bg-white/90 border-none gap-2 rounded-xl font-bold px-4">
                <Link href="/courses">
                  Pilih Kursus Lain <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              </Button>
            </motion.div>
          ) : activeNode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-4 shadow-xl border border-zinc-800 dark:border-zinc-200"
            >
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current shrink-0" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base truncate">Lanjutkan belajar!</h3>
                  <p className="text-xs opacity-70 truncate">Stage {activeNodeIndex + 1}: {activeNode.title}</p>
                </div>
              </div>
              <Button asChild size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-none gap-2 rounded-xl group px-4">
                <Link href={`/learn/lesson/${activeNode.id}`}>
                  Lanjutkan <ArrowRight className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          )}

          {/* 1. HEADER KURSUS (Card Warna-Warni) */}
          <div className={`p-6 rounded-2xl text-white shadow-lg flex flex-col gap-6 transition-colors duration-500 ${isUnitComplete ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-blue-600 shadow-blue-600/20'}`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-bold mb-1 flex items-start sm:items-center justify-center sm:justify-start gap-2">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5 sm:mt-0" />
                  <span className="line-clamp-2 break-words">{activeCourse.title}</span>
                </h2>
                <p className="text-white/90 text-xs sm:text-sm max-w-md line-clamp-3 break-words mt-1.5">{activeCourse.description}</p>
              </div>
              <div className="flex gap-2">
                {/* <Button
                  variant="outline"
                  onClick={async () => {
                    if (confirm("Apakah Anda yakin ingin mereset progress belajar Anda untuk keperluan testing?")) {
                      const res = await resetLearningProgressAction();
                      if (res.success) {
                        resetProgress();
                      } else {
                        alert("Gagal melakukan reset pada database.");
                      }
                    }
                  }}
                  className="bg-black/20 hover:bg-black/40 border-none text-white transition-colors"
                  title="Reset Pembelajaran (Testing)"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button> */}
                <Button asChild variant="secondary" className={`font-bold whitespace-nowrap border-none shadow-md ${isUnitComplete ? 'text-emerald-600' : 'text-blue-600'}`}>
                  <Link href="/courses">
                    Ganti Kursus
                  </Link>
                </Button>
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
                <Button asChild variant="outline" className="font-bold">
                  <Link href="/courses">Kembali ke Daftar Kelas</Link>
                </Button>
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
                      ? 'bg-emerald-600'
                      : unitIdx === 0 || globalStartIdx <= activeNodeIndex
                        ? 'bg-blue-600'
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
            KOLOM KANAN: WIDGETS
           ========================================= */}
        <div className="flex flex-col justify-start gap-6 h-fit sticky top-6">
          <div className="hidden lg:grid w-full grid-cols-4 gap-2">
            <div className="flex items-center justify-center">
              <CourseSelectorDropdown courses={allCoursesList} />
            </div>
            {role === 'mahasiswa' && (
              <>
                <div className="flex items-center justify-center">
                  <StreakDisplay 
                    variant="stat-widget" 
                    hoverContent={<Suspense fallback={<div className="w-64 h-64 bg-zinc-900 rounded-2xl animate-pulse" />}><StreakCalendarWidget activityHistory={activityHistory} streak={streak} /></Suspense>} 
                  />
                </div>
                <div className="flex items-center justify-center">
                  <StatWidget 
                    align="center"
                    icon={Zap} color="text-blue-500" label="XP" value={xp} href="/profile"
                    hoverContent={
                      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-xl p-3 w-48 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">XP Saya</div>
                        <div className="font-bold text-sm text-blue-600 dark:text-blue-400 mb-1">Level {level}</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-300">
                          Butuh <strong className="text-zinc-900 dark:text-zinc-100">{xpToNextLevel} XP</strong> lagi untuk naik level!
                        </div>
                      </div>
                    }
                  />
                </div>
                <div className="flex items-center justify-center">
                  <StatWidget align="center" icon={Trophy} color="text-yellow-500" label="Peringkat" value={userRank} prefix="#" href="/leaderboard" />
                </div>
              </>
            )}
          </div>

          {role === 'mahasiswa' && (
            <Suspense fallback={<div className="h-40 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />}>
              <DailyGoalWidget dailyGoals={dailyGoals} />
            </Suspense>
          )}

          {/* role === 'mahasiswa' && (
            <Card className="hidden lg:block p-4 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-sm text-zinc-500 mb-3">🔧 Debug / Testing</h3>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="secondary" onClick={handleSimulateLesson} className="w-full border border-zinc-200 h-8 text-xs hover:bg-white">
                  Simulasi Selesai Lesson (Klik Node Biru)
                </Button>
              </div>
            </Card>
          ) */}

          {role === 'mahasiswa' && (
            <Suspense fallback={<div className="h-64 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />}>
              <LeaderboardWidget
                topUsers={computedLeaderboard}
                currentUserId="current"
                currentUserName={name}
                currentUserXp={weeklyXp}
                currentUserRank={userRank}
              />
            </Suspense>
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