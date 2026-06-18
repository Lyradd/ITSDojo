"use client";

import { useUserStore } from "@/lib/store";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, CheckCircle, ChevronDown } from "lucide-react";
import Link from "next/link";

interface CourseSelectorDropdownProps {
  courses: any[];
}

export function CourseSelectorDropdown({ courses }: CourseSelectorDropdownProps) {
  const { activeCourseId, setActiveCourse, enrolledCourseIds, completedLessonIds, semester } = useUserStore();

  const activeCourse = courses.find((c) => c.id === activeCourseId) || courses[0];

  // Ambil kelas yang sesuai dengan semester pengguna (serta status enrollment)
  const enrolledCourses = courses.filter((c) => {
    const isEnrolled = enrolledCourseIds && enrolledCourseIds.length > 0 ? enrolledCourseIds.includes(c.id) : true;
    const isMatchingSemester = semester ? c.requiredSemester === semester : true;
    return isEnrolled && isMatchingSemester;
  });

  if (!activeCourse) return null;

  return (
    <HoverCard openDelay={100} closeDelay={85}>
      <HoverCardTrigger asChild>
        <Link
          href="/courses"
          aria-label="Pilih Kelas"
          className="flex items-center gap-1 py-1.5 px-2 rounded-xl bg-transparent border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:scale-105 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0 shadow-sm"
        >
          <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        className="w-72 rounded-2xl p-3 z-[100] border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-950 mt-1"
      >
        <div className="text-xs text-zinc-500 font-black uppercase tracking-wider px-2 py-1 mb-2">
          Kelas Saya (Semester {semester})
        </div>
        <div className="max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600 space-y-1">
          {enrolledCourses.length > 0 ? (
            enrolledCourses.map((course) => {
              const isActive = activeCourseId === course.id;

              // Hitung progres kelas secara dinamis
              const totalLessons = course.lessonsCount || (course.lessonIds?.length || 0);
              const completedLessons = (course.lessonIds || []).filter((id: string) =>
                completedLessonIds.includes(id)
              ).length;
              const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setActiveCourse(course.id);
                  }}
                  className={`flex flex-col gap-2 p-2.5 cursor-pointer rounded-xl transition-all duration-200 border ${isActive
                    ? "bg-blue-50/75 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30"
                    : "border-transparent hover:bg-zinc-50 dark:hover:bg-white/5"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex shrink-0 items-center justify-center border shadow-sm ${isActive
                        ? "bg-blue-500 text-white border-blue-600"
                        : "bg-white dark:bg-zinc-850 border-zinc-255 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400"
                        }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-xs sm:text-sm font-bold truncate ${isActive
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-zinc-750 dark:text-zinc-350"
                        }`}>
                        {course.title}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                        {completedLessons} dari {totalLessons} Materi Selesai
                      </p>
                    </div>
                    {progressPercent === 100 && (
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                  </div>
                  <div className="w-full px-0.5">
                    <Progress value={progressPercent} className="h-1.5 bg-zinc-100 dark:bg-zinc-800 [&>div]:bg-blue-500" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-4 text-xs text-zinc-500 text-center">
              Belum ada kelas di semester ini
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
